#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const trustedToolDirectories = [
	'/usr/bin',
	'/bin',
	'/usr/local/bin',
	'/opt/homebrew/bin'
];

let tools;
try {
	tools = {
		git: resolveTool('git'),
		tar: resolveTool('tar'),
		make: resolveTool('make'),
		node: resolveCurrentNode(),
		sh: resolveTool('sh')
	};
} catch {
	console.error('Required verification tools are unavailable or unsafe.');
	process.exit(2);
}

const targets = new Map([
	['lint', '__chrome_blocker_lint'],
	['test', '__chrome_blocker_test'],
	['build', '__chrome_blocker_build'],
	['verify', '__chrome_blocker_verify'],
	['check', '__chrome_blocker_check']
]);

const args = process.argv.slice(2);
if (args.length !== 2 || !targets.has(args[1])) {
	console.error('Usage: node scripts/run-make.js <repository> <lint|test|build|verify|check>');
	process.exit(2);
}

let root;
let rootHandle;
let rootIdentity;
try {
	root = fs.realpathSync(args[0]);
	rootHandle = fs.openSync(root, fs.constants.O_RDONLY);
	rootIdentity = fs.fstatSync(rootHandle);
	const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
	const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
	if (manifest.name !== 'GetToWork' || manifest.version !== '0.01' ||
		!/^CHROME_BLOCKER_REPOSITORY_MAKEFILE := 1$/m.test(makefile)) {
		throw new Error('identity mismatch');
	}
} catch {
	if (rootHandle !== undefined) fs.closeSync(rootHandle);
	console.error('Repository path does not identify a Chrome Blocker checkout.');
	process.exit(2);
}

const token = crypto.randomBytes(32).toString('hex');
const contextDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-blocker-launch-'));
const snapshotPath = path.join(contextDirectory, 'repository');
const contextPath = path.join(contextDirectory, 'context.json');
const gitHome = path.join(contextDirectory, 'git-home');
const gitConfig = path.join(contextDirectory, 'git-config');
const gitHooks = path.join(contextDirectory, 'git-hooks');
let head;
let snapshotRoot;
try {
	fs.mkdirSync(gitHome, { mode: 0o700 });
	fs.mkdirSync(gitConfig, { mode: 0o700 });
	fs.mkdirSync(gitHooks, { mode: 0o700 });
	head = createSnapshot(root, rootIdentity, snapshotPath, createGitContext(root));
	snapshotRoot = fs.realpathSync(snapshotPath);
	verifyRepository(snapshotRoot);
} catch {
	fs.closeSync(rootHandle);
	fs.rmSync(contextDirectory, { recursive: true, force: true });
	console.error('Repository changed or is not a clean Chrome Blocker checkout.');
	process.exit(2);
}
fs.closeSync(rootHandle);

const environment = { ...process.env };
for (const name of [
	'MAKEFLAGS',
	'MFLAGS',
	'MAKEFILES',
	'GNUMAKEFLAGS',
	'MAKEOVERRIDES',
	'MAKE_RESTARTS',
	'MAKELEVEL',
	'MAKEFILE_LIST',
	'ROOT',
	'BOOTSTRAP_NODE',
	'CHROME_BLOCKER_LAUNCH_CONTEXT',
	'CHROME_BLOCKER_LAUNCH_TOKEN'
]) {
	delete environment[name];
}
environment.PATH = '/usr/bin:/bin';
environment.CHROME_BLOCKER_LAUNCH_CONTEXT = contextPath;
environment.CHROME_BLOCKER_LAUNCH_TOKEN = token;
environment.CHROME_BLOCKER_NODE = tools.node.path;
environment.CHROME_BLOCKER_SH = tools.sh.path;

let result;
try {
	fs.writeFileSync(contextPath, JSON.stringify({ root: snapshotRoot, token, head }), { mode: 0o600 });
	verifyTool(tools.node);
	verifyTool(tools.sh);
	verifyTool(tools.make);
	result = spawnSync(tools.make.path, [
		'--no-builtin-rules',
		'--no-builtin-variables',
		'-C',
		snapshotRoot,
		'-f',
		'Makefile',
		'--',
		targets.get(args[1])
	], {
		env: environment,
		stdio: 'inherit',
		shell: false
	});
} finally {
	fs.rmSync(contextDirectory, { recursive: true, force: true });
}

if (result.error) {
	console.error(result.error.message);
	process.exit(127);
}
process.exit(result.status === null ? 1 : result.status);

function createSnapshot(sourceRoot, expectedIdentity, destination, gitContext) {
	const status = git(gitContext, ['status', '--porcelain=v1', '--untracked-files=all'], 'utf8');
	if (status.stdout !== '') throw new Error('dirty source');
	const head = git(gitContext, ['rev-parse', '--verify', 'HEAD^{commit}'], 'utf8').stdout.trim();
	const tree = git(gitContext, ['rev-parse', 'HEAD^{tree}'], 'utf8').stdout.trim();
	if (git(gitContext, ['write-tree'], 'utf8').stdout.trim() !== tree) throw new Error('index mismatch');
	const archive = git(gitContext, ['archive', '--format=tar', head], null);
	fs.mkdirSync(destination, { mode: 0o700 });
	verifyTool(tools.tar);
	const extraction = spawnSync(tools.tar.path, ['-xf', '-', '-C', destination], {
		input: archive.stdout,
		env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' },
		stdio: ['pipe', 'ignore', 'pipe'],
		shell: false
	});
	if (extraction.error || extraction.status !== 0) throw new Error('snapshot extraction failed');
	const currentIdentity = fs.statSync(sourceRoot);
	if (currentIdentity.dev !== expectedIdentity.dev || currentIdentity.ino !== expectedIdentity.ino) {
		throw new Error('source identity changed');
	}
	if (git(gitContext, ['rev-parse', '--verify', 'HEAD^{commit}'], 'utf8').stdout.trim() !== head ||
		git(gitContext, ['rev-parse', 'HEAD^{tree}'], 'utf8').stdout.trim() !== tree ||
		git(gitContext, ['write-tree'], 'utf8').stdout.trim() !== tree ||
		git(gitContext, ['status', '--porcelain=v1', '--untracked-files=all'], 'utf8').stdout !== '') {
		throw new Error('source changed');
	}
	return head;
}

function createGitContext(repository) {
	const dotGit = path.join(repository, '.git');
	let gitDirectory;
	const metadata = fs.lstatSync(dotGit);
	if (metadata.isDirectory()) {
		gitDirectory = fs.realpathSync(dotGit);
	} else if (metadata.isFile()) {
		const match = /^gitdir: (.+)\r?\n?$/.exec(fs.readFileSync(dotGit, 'utf8'));
		if (!match) throw new Error('invalid git directory file');
		gitDirectory = fs.realpathSync(path.resolve(repository, match[1]));
	} else {
		throw new Error('invalid git metadata');
	}
	const context = {
		repository,
		gitDirectory,
		configuration: [
			['core.hooksPath', gitHooks],
			['core.fsmonitor', 'false'],
			['core.filemode', 'true'],
			['core.ignorestat', 'false'],
			['core.trustctime', 'true'],
			['core.checkStat', 'default'],
			['core.symlinks', 'true'],
			['credential.helper', '']
		],
			environment: {
			PATH: '/usr/bin:/bin',
			HOME: gitHome,
			XDG_CONFIG_HOME: gitConfig,
			GIT_CONFIG_NOSYSTEM: '1',
			GIT_CONFIG_GLOBAL: '/dev/null',
			GIT_CONFIG_SYSTEM: '/dev/null',
			GIT_OPTIONAL_LOCKS: '0',
			GIT_TERMINAL_PROMPT: '0',
			LC_ALL: 'C'
		}
	};
	const configuredFilters = git(context, [
		'config', '--local', '--name-only', '--get-regexp',
		'^filter\\..*\\.(clean|smudge|process|required)$'
	], 'utf8', [0, 1]);
	for (const key of configuredFilters.stdout.split('\n').filter(Boolean)) {
		context.configuration.push([key, key.endsWith('.required') ? 'false' : '']);
	}
	return context;
}

function git(context, args, encoding, allowedStatuses = [0]) {
	verifyTool(tools.git);
	const result = spawnSync(tools.git.path, [
		`--git-dir=${context.gitDirectory}`,
		`--work-tree=${context.repository}`,
		'--no-optional-locks',
		...context.configuration.flatMap(([key, value]) => ['-c', `${key}=${value}`]),
		...args
	], {
		encoding,
		env: context.environment,
		maxBuffer: 64 * 1024 * 1024,
		shell: false
	});
	if (result.error || !allowedStatuses.includes(result.status)) throw new Error('git verification failed');
	return result;
}

function resolveTool(name) {
	for (const directory of trustedToolDirectories) {
		const candidate = path.join(directory, name);
		try {
			const resolved = fs.realpathSync(candidate);
			const stat = fs.statSync(resolved);
			if (!stat.isFile() || (stat.mode & 0o111) === 0) continue;
			return { path: resolved, dev: stat.dev, ino: stat.ino, uid: stat.uid };
		} catch {}
	}
	throw new Error('tool unavailable');
}

function resolveCurrentNode() {
	const resolved = fs.realpathSync(process.execPath);
	const stat = fs.statSync(resolved);
	if (!stat.isFile() || (stat.mode & 0o111) === 0) throw new Error('node unavailable');
	return { path: resolved, dev: stat.dev, ino: stat.ino, uid: stat.uid };
}

function verifyTool(tool) {
	const stat = fs.statSync(tool.path);
	if (!stat.isFile() || stat.dev !== tool.dev || stat.ino !== tool.ino || stat.uid !== tool.uid ||
		(stat.mode & 0o111) === 0) {
		throw new Error('verification tool changed');
	}
}

function verifyRepository(repository) {
	const manifest = JSON.parse(fs.readFileSync(path.join(repository, 'manifest.json'), 'utf8'));
	const makefile = fs.readFileSync(path.join(repository, 'Makefile'), 'utf8');
	if (manifest.name !== 'GetToWork' || manifest.version !== '0.01' ||
		!/^CHROME_BLOCKER_REPOSITORY_MAKEFILE := 1$/m.test(makefile)) {
		throw new Error('snapshot identity mismatch');
	}
}
