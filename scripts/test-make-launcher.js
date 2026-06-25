#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const test = require('node:test');

const sourceRepository = process.env.CHROME_BLOCKER_SOURCE || path.resolve(__dirname, '..');
const launcherName = path.join('scripts', 'run-make.js');
const testFiles = [
	'test-url-rules.js',
	'test-content-script.js',
	'test-background.js',
	'test-blocked-site.js',
	'test-popup.js'
];

function copyRepository(target) {
	fs.cpSync(sourceRepository, target, {
		recursive: true,
		filter: entry => path.basename(entry) !== '.git'
	});
	runGit(target, ['init', '-q']);
	runGit(target, ['config', 'user.name', 'Chrome Blocker Test']);
	runGit(target, ['config', 'user.email', 'test@example.invalid']);
	commitRepository(target);
}

function runGit(repository, args) {
	const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8' });
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	return result.stdout;
}

function commitRepository(repository) {
	runGit(repository, ['add', '-A']);
	const staged = spawnSync('git', ['-C', repository, 'diff', '--cached', '--quiet']);
	if (staged.status !== 0) runGit(repository, ['commit', '-qm', 'fixture']);
}

function createTools(tempRoot, repository) {
	const bin = path.join(tempRoot, 'bin');
	const log = path.join(tempRoot, 'commands.log');
	fs.mkdirSync(bin, { recursive: true });

	const baseline = path.join(repository, 'scripts', 'check-baseline.sh');
	const trackedLink = path.join(repository, 'tracked-readme-link');
	if (!fs.existsSync(trackedLink)) fs.symlinkSync('README.md', trackedLink);
	fs.writeFileSync(baseline, `#!/bin/sh
"$CHROME_BLOCKER_TEST_NODE" -e '
const fs = require("node:fs");
const path = require("node:path");
if (!fs.lstatSync(path.join(process.cwd(), "tracked-readme-link")).isSymbolicLink()) process.exit(43);
fs.appendFileSync(process.env.CHROME_BLOCKER_COMMAND_LOG, JSON.stringify({ kind: "baseline", args: [], cwd: process.cwd(), contextMode: fs.statSync(path.dirname(process.cwd())).mode & 0o777 }) + "\\n");
if (process.env.CHROME_BLOCKER_FAIL_BASELINE) process.exit(41);
'
`);
	fs.chmodSync(baseline, 0o755);
	for (const testFile of testFiles) {
		fs.writeFileSync(path.join(repository, 'scripts', testFile), `'use strict';
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(process.env.CHROME_BLOCKER_COMMAND_LOG, JSON.stringify({ kind: 'node', args: process.argv.slice(1), cwd: process.cwd(), contextMode: fs.statSync(path.dirname(process.cwd())).mode & 0o777 }) + '\\n');
if (process.env.CHROME_BLOCKER_FAIL_SCRIPT === path.basename(process.argv[1])) process.exit(37);
`);
	}
	commitRepository(repository);
	return { bin, log };
}

function readCommands(log) {
	if (!fs.existsSync(log)) return [];
	return fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

function expectedCommands(repository, target) {
	const root = repository;
	const baseline = { kind: 'baseline', args: [], cwd: root, contextMode: 0o700 };
	const nodes = testFiles.map(file => ({
		kind: 'node',
		args: [path.join(root, 'scripts', file)],
		cwd: root,
		contextMode: 0o700
	}));
	if (target === 'lint' || target === 'build') return [baseline];
	if (target === 'test') return nodes;
	return [baseline, ...nodes];
}

function assertSnapshotCommands(commands, target) {
	assert.notEqual(commands.length, 0);
	const snapshotRoot = commands[0].cwd;
	assert.match(snapshotRoot, /chrome-blocker-launch-/);
	assert.equal(commands[0].contextMode, 0o700);
	assert.deepEqual(commands, expectedCommands(snapshotRoot, target));
	assert.equal(fs.existsSync(path.dirname(snapshotRoot)), false);
}

function environment(tools, extra = {}) {
	return {
		...process.env,
		PATH: `${tools.bin}${path.delimiter}${process.env.PATH}`,
		CHROME_BLOCKER_TEST_NODE: process.execPath,
		CHROME_BLOCKER_COMMAND_LOG: tools.log,
		...extra
	};
}

function runLauncher(repository, args, cwd, tools, extra = {}) {
	return spawnSync(process.execPath, [path.join(repository, launcherName), ...args], {
		cwd,
		env: environment(tools, extra),
		encoding: 'utf8'
	});
}

function runPublicCommand(repository, args, cwd, extra = {}) {
	return spawnSync('/usr/bin/env', [
		'-i',
		'HOME=/nonexistent',
		'LANG=C',
		'LC_ALL=C',
		'PATH=/usr/bin:/bin',
		'TMPDIR=/tmp',
		'TZ=UTC',
		process.execPath,
		path.join(repository, launcherName),
		...args
	], {
		cwd,
		env: { ...process.env, ...extra },
		encoding: 'utf8'
	});
}

function installEnvironmentProbe(repository, log, marker) {
	const probePath = path.join(repository, 'scripts', 'environment-probe.js');
	const probe = `'use strict';
const fs = require('node:fs');
const forbiddenNames = ${JSON.stringify([
		'NODE_OPTIONS', 'NODE_PATH', 'NODE_REPL_HISTORY', 'NPM_CONFIG_NODE_OPTIONS',
		'npm_config_node_options', 'npm_lifecycle_event', 'npm_package_name',
		'BASH_ENV', 'ENV', 'SHELLOPTS',
		'GIT_DIR', 'GIT_WORK_TREE'
	])};
const forbiddenPrefixes = ['NPM_CONFIG_', 'npm_'];
const leaked = Object.keys(process.env).filter(name =>
	forbiddenNames.includes(name) || forbiddenPrefixes.some(prefix => name.startsWith(prefix))
);
if (leaked.length !== 0) {
	fs.appendFileSync(${JSON.stringify(marker)}, leaked.join(',') + '\\n');
	process.exit(91);
}
fs.appendFileSync(${JSON.stringify(log)}, process.argv[1] + '\\n');
`;
	fs.writeFileSync(probePath, probe);
	const baseline = path.join(repository, 'scripts', 'check-baseline.sh');
	fs.writeFileSync(baseline, `#!/bin/sh\n"$CHROME_BLOCKER_NODE" scripts/environment-probe.js baseline\n`);
	fs.chmodSync(baseline, 0o755);
	for (const testFile of testFiles) {
		fs.writeFileSync(path.join(repository, 'scripts', testFile), `'use strict';\nrequire('./environment-probe.js');\n`);
	}
	commitRepository(repository);
}

function runRawMake(make, args, cwd, tools, extra = {}) {
	return spawnSync(make, args, {
		cwd,
		env: environment(tools, extra),
		encoding: 'utf8'
	});
}

function withFixture(name, callback) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `chrome-blocker-v2-${name}-`));
	try {
		return callback(tempRoot);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

test('clean-child command clears NODE_OPTIONS before the Node child starts', () => {
	withFixture('runtime-environment', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const marker = path.join(tempRoot, 'node-options-marker');
		const preload = path.join(tempRoot, 'preload.cjs');
		fs.writeFileSync(preload, `require('node:fs').appendFileSync(${JSON.stringify(marker)}, process.pid + '\\n');\n`);
		const result = runPublicCommand(repository, [repository, 'check'], tempRoot, {
			NODE_OPTIONS: `--require=${preload}`
		});
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
	});
});

test('clean-child command removes post-start Node, npm, shell, Git, and Make variables from every gate', () => {
	withFixture('runtime-gates', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const marker = path.join(tempRoot, 'environment-marker');
		const log = path.join(tempRoot, 'environment-log');
		installEnvironmentProbe(repository, log, marker);
		const shellInit = path.join(tempRoot, 'shell-init');
		fs.writeFileSync(shellInit, `printf shell-init >> ${JSON.stringify(marker)}\n`);
		const result = runPublicCommand(repository, [repository, 'check'], tempRoot, {
			NODE_PATH: tempRoot,
			NODE_REPL_HISTORY: path.join(tempRoot, 'history'),
			NPM_CONFIG_NODE_OPTIONS: '--trace-warnings',
			npm_config_node_options: '--trace-warnings',
			npm_lifecycle_event: 'hostile',
			npm_package_name: 'hostile',
			BASH_ENV: shellInit,
			ENV: shellInit,
			SHELLOPTS: 'xtrace',
			PS4: `$(printf ps4 >> ${marker}) `,
			GIT_DIR: path.join(tempRoot, 'wrong-git'),
			MAKEFLAGS: '--eval=$(shell false)'
		});
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
		assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 6);
	});
});

test('path-safe launcher rejects extra arguments, flags, assignments, and unsupported targets', () => {
	withFixture('bootstrap-arguments', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const marker = path.join(tempRoot, 'argument-marker');
		const preload = path.join(tempRoot, 'preload.cjs');
		fs.writeFileSync(preload, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed');\n`);
		for (const args of [
			[],
			[repository],
			[repository, '--eval=marker'],
			[repository, 'ROOT=marker'],
			[repository, 'check', 'test'],
			['-C/tmp', 'check']
		]) {
			const result = runPublicCommand(repository, args, tempRoot, {
				NODE_OPTIONS: `--require=${preload}`
			});
			assert.equal(result.status, 2, `${JSON.stringify(args)}\n${result.stdout}\n${result.stderr}`);
			assert.equal(fs.existsSync(marker), false);
		}
	});
});

test('clean-child command uses absolute Node and ignores child PATH and startup variables', () => {
	withFixture('bootstrap-path', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const bin = path.join(tempRoot, 'bin');
		const marker = path.join(tempRoot, 'path-marker');
		fs.mkdirSync(bin);
		fs.writeFileSync(path.join(bin, 'node'), `#!/bin/sh\nprintf wrapper >> ${JSON.stringify(marker)}\nexit 0\n`);
		fs.chmodSync(path.join(bin, 'node'), 0o755);
		const shellInit = path.join(tempRoot, 'shell-init');
		fs.writeFileSync(shellInit, `alias node='printf alias >> ${JSON.stringify(marker)}'\nprintf startup >> ${JSON.stringify(marker)}\n`);
		const result = runPublicCommand(repository, [repository, 'check'], tempRoot, {
			PATH: `${bin}${path.delimiter}${process.env.PATH}`,
			BASH_ENV: shellInit,
			ENV: shellInit
		});
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
	});
});

test('launcher preserves hostile repository bytes through a symlink with exact check argv', () => {
	withFixture('hostile', tempRoot => {
		const marker = path.join(tempRoot, 'path-marker');
		const repository = path.join(tempRoot, ` repo$(shell touch ${marker})\n$ quote'"\\;># `);
		copyRepository(repository);
		const link = path.join(tempRoot, 'repository-link');
		fs.symlinkSync(repository, link, 'dir');
		const tools = createTools(tempRoot, repository);
		const result = runLauncher(repository, [link, 'check'], tempRoot, tools);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
		assertSnapshotCommands(readCommands(tools.log), 'check');
	});
});

test('launcher exposes only documented targets and exact gate argv', () => {
	withFixture('targets', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		for (const target of ['lint', 'test', 'build', 'verify', 'check']) {
			const caseRoot = path.join(tempRoot, target);
			const tools = createTools(caseRoot, repository);
			const result = runLauncher(repository, [repository, target], tempRoot, tools);
			assert.equal(result.status, 0, `${target}\n${result.stdout}\n${result.stderr}`);
			assertSnapshotCommands(readCommands(tools.log), target);
		}
	});
});

test('launcher rejects Make flags, assignments, external Makefiles, and extra targets before Make', () => {
	withFixture('arguments', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const marker = path.join(tempRoot, 'argument-marker');
		for (const args of [
			[],
			[repository],
			[repository, '-C', repository, 'check'],
			[repository, '-f', `$(shell touch ${marker})`, 'check'],
			[repository, `--eval=$(shell touch ${marker})`, 'check'],
			[repository, `ROOT=$(shell touch ${marker})`, 'check'],
			[repository, 'check', 'test'],
			[repository, 'unknown']
		]) {
			const tools = createTools(fs.mkdtempSync(path.join(tempRoot, 'case-')), repository);
			const result = runLauncher(repository, args, tempRoot, tools);
			assert.equal(result.status, 2, JSON.stringify(args));
			assert.deepEqual(readCommands(tools.log), [], JSON.stringify(args));
			assert.equal(fs.existsSync(marker), false, JSON.stringify(args));
		}
	});
});

test('launcher clears dangerous Make environment channels', () => {
	withFixture('environment', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		for (const channel of [
			'MAKEFLAGS', 'MFLAGS', 'MAKEFILES', 'GNUMAKEFLAGS', 'MAKEOVERRIDES',
			'MAKE_RESTARTS', 'MAKELEVEL', 'MAKEFILE_LIST', 'ROOT', 'BOOTSTRAP_NODE',
			'CHROME_BLOCKER_LAUNCH_CONTEXT', 'CHROME_BLOCKER_LAUNCH_TOKEN'
		]) {
			const caseRoot = path.join(tempRoot, channel);
			const marker = path.join(caseRoot, 'marker');
			const tools = createTools(caseRoot, repository);
			const result = runLauncher(repository, [repository, 'test'], tempRoot, tools, {
				[channel]: `$(shell touch ${marker})`
			});
			assert.equal(result.status, 0, `${channel}\n${result.stdout}\n${result.stderr}`);
			assert.equal(fs.existsSync(marker), false, channel);
			assertSnapshotCommands(readCommands(tools.log), 'test');
		}
	});
});

test('launcher isolates Git repository, object, index, discovery, config, lock, and trace channels', () => {
	withFixture('git-environment', tempRoot => {
		const selected = path.join(tempRoot, 'selected');
		const replacement = path.join(tempRoot, 'replacement');
		copyRepository(selected);
		copyRepository(replacement);
		const marker = path.join(tempRoot, 'git-environment-marker');
		const hook = path.join(tempRoot, 'fsmonitor-hook');
		fs.writeFileSync(hook, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'hook');\nprocess.stdout.write('{}\\n');\n`);
		fs.chmodSync(hook, 0o755);
		fs.appendFileSync(path.join(replacement, 'Makefile'), `\n$(shell touch ${marker})\n`);
		commitRepository(replacement);
		const gitDir = runGit(replacement, ['rev-parse', '--absolute-git-dir']).trim();
		const objectDirectory = path.join(gitDir, 'objects');
		const indexFile = path.join(gitDir, 'index');
		const globalConfig = path.join(tempRoot, 'global.gitconfig');
		const systemConfig = path.join(tempRoot, 'system.gitconfig');
		fs.writeFileSync(globalConfig, `[core]\n\tfsmonitor = ${hook}\n`);
		fs.writeFileSync(systemConfig, `[core]\n\tfsmonitor = ${hook}\n`);
		for (const [name, value, extras = {}] of [
			['GIT_DIR', gitDir, { GIT_WORK_TREE: replacement }],
			['GIT_WORK_TREE', replacement, { GIT_DIR: gitDir }],
			['GIT_OBJECT_DIRECTORY', objectDirectory],
			['GIT_ALTERNATE_OBJECT_DIRECTORIES', objectDirectory],
			['GIT_INDEX_FILE', indexFile],
			['GIT_COMMON_DIR', gitDir],
			['GIT_CEILING_DIRECTORIES', tempRoot],
			['GIT_DISCOVERY_ACROSS_FILESYSTEM', '1'],
			['GIT_CONFIG_GLOBAL', globalConfig],
			['GIT_CONFIG_SYSTEM', systemConfig],
			['GIT_CONFIG_NOSYSTEM', '0', { GIT_CONFIG_SYSTEM: systemConfig }],
			['GIT_OPTIONAL_LOCKS', '0'],
			['GIT_TRACE', '1'],
			['GIT_TRACE_SETUP', '1'],
			['GIT_TRACE_PACKET', '1'],
			['GIT_TRACE_PERFORMANCE', '1'],
			['GIT_TRACE_SHALLOW', '1'],
			['GIT_TRACE_CURL', '1'],
			['GIT_TRACE_CURL_NO_DATA', '1'],
			['GIT_TRACE2', '1'],
			['GIT_TRACE2_EVENT', '1'],
			['GIT_TRACE2_PERF', '1'],
			['GIT_TRACE2_BRIEF', '1'],
			['GIT_CONFIG_PARAMETERS', "'core.fsmonitor'='" + hook + "'"],
			['GIT_CONFIG_COUNT', '1', {
				GIT_CONFIG_KEY_0: 'core.fsmonitor',
				GIT_CONFIG_VALUE_0: hook
			}]
		]) {
			fs.rmSync(marker, { force: true });
			const tools = createTools(path.join(tempRoot, name), selected);
			const result = runLauncher(selected, [selected, 'check'], tempRoot, tools, {
				[name]: value,
				...extras
			});
			assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
			assert.equal(fs.existsSync(marker), false, name);
			assert.equal(/trace:|performance:|== Info:/i.test(result.stderr), false, name);
			assertSnapshotCommands(readCommands(tools.log), 'check');
		}
	});
});

test('launcher ignores caller PATH wrappers for git, tar, make, node, npm, and sh', () => {
	withFixture('tool-path', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const bin = path.join(tempRoot, 'hostile-bin');
		fs.mkdirSync(bin);
		const markers = [];
		for (const command of ['git', 'tar', 'make', 'node', 'npm', 'sh']) {
			const realCommand = command === 'node'
				? process.execPath
				: spawnSync('/bin/sh', ['-c', `command -v ${command}`], { encoding: 'utf8' }).stdout.trim();
			if (realCommand === '') continue;
			const marker = path.join(tempRoot, `${command}-marker`);
			markers.push(marker);
			const executable = path.join(bin, command);
			fs.writeFileSync(executable, `#!/bin/sh\ntouch '${marker}'\nexec '${realCommand}' "$@"\n`);
			fs.chmodSync(executable, 0o755);
		}
		const result = spawnSync(process.execPath, [path.join(repository, launcherName), repository, 'check'], {
			cwd: tempRoot,
			env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
			encoding: 'utf8'
		});
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		for (const marker of markers) assert.equal(fs.existsSync(marker), false, marker);
		assert.match(result.stdout, /Popup runtime message boundary tests passed/);
	});
});

test('launcher disables repository-local fsmonitor configuration', () => {
	withFixture('local-git-config', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const marker = path.join(tempRoot, 'local-config-marker');
		const hook = path.join(tempRoot, 'fsmonitor-hook');
		fs.writeFileSync(hook, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'hook');\nprocess.stdout.write('{}\\n');\n`);
		fs.chmodSync(hook, 0o755);
		const tools = createTools(tempRoot, repository);
		runGit(repository, ['config', 'core.fsmonitor', hook]);
		fs.rmSync(marker, { force: true });
		const result = runLauncher(repository, [repository, 'check'], tempRoot, tools);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
		assertSnapshotCommands(readCommands(tools.log), 'check');
	});
});

test('launcher disables repository-local clean and process filters', () => {
	withFixture('local-filter-config', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		fs.writeFileSync(path.join(repository, '.gitattributes'), 'README.md filter=hostile\n');
		commitRepository(repository);
		const marker = path.join(tempRoot, 'filter-marker');
		const filter = path.join(tempRoot, 'filter');
		fs.writeFileSync(filter, `#!/bin/sh\ncat\ntouch '${marker}'\n`);
		fs.chmodSync(filter, 0o755);
		const tools = createTools(tempRoot, repository);
		runGit(repository, ['config', 'filter.hostile.clean', filter]);
		runGit(repository, ['config', 'filter.hostile.smudge', filter]);
		runGit(repository, ['config', 'filter.hostile.required', 'true']);
		fs.rmSync(marker, { force: true });
		const result = runLauncher(repository, [repository, 'check'], tempRoot, tools);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.equal(fs.existsSync(marker), false);
		assertSnapshotCommands(readCommands(tools.log), 'check');
	});
});

test('selected repository identity wins over caller and neighboring marked checkouts', () => {
	withFixture('identity', tempRoot => {
		const selected = path.join(tempRoot, 'selected');
		const caller = path.join(tempRoot, 'caller');
		copyRepository(selected);
		copyRepository(caller);
		const tools = createTools(tempRoot, selected);
		const result = runLauncher(selected, [selected, 'check'], caller, tools, {
			ROOT: caller,
			MAKEFILE_LIST: path.join(caller, 'Makefile')
		});
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assertSnapshotCommands(readCommands(tools.log), 'check');
	});
});

test('invalid repository identity fails before any gate', () => {
	withFixture('invalid', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const invalid = path.join(tempRoot, 'invalid');
		copyRepository(invalid);
		const marker = path.join(tempRoot, 'invalid-makefile-marker');
		const manifest = JSON.parse(fs.readFileSync(path.join(invalid, 'manifest.json'), 'utf8'));
		manifest.name = 'WrongProject';
		fs.writeFileSync(path.join(invalid, 'manifest.json'), JSON.stringify(manifest));
		fs.appendFileSync(path.join(invalid, 'Makefile'), `\n$(shell touch ${marker})\n`);
		commitRepository(invalid);
		const tools = createTools(tempRoot, repository);
		const result = runLauncher(repository, [invalid, 'check'], tempRoot, tools);
		assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
		assert.deepEqual(readCommands(tools.log), []);
		assert.equal(fs.existsSync(marker), false);
	});
});

test('launcher rejects tracked and untracked source changes before snapshot execution', () => {
	for (const change of ['tracked', 'untracked']) {
		withFixture(`dirty-${change}`, tempRoot => {
			const repository = path.join(tempRoot, 'repository');
			copyRepository(repository);
			const tools = createTools(tempRoot, repository);
			if (change === 'tracked') {
				fs.appendFileSync(path.join(repository, 'README.md'), '\nchanged\n');
			} else {
				fs.writeFileSync(path.join(repository, 'untracked.txt'), 'changed\n');
			}
			const result = runLauncher(repository, [repository, 'check'], tempRoot, tools);
			assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
			assert.deepEqual(readCommands(tools.log), []);
		});
	}
});

test('launcher rejects mode, symlink, hardlink content, and staged index changes', () => {
	for (const change of ['mode', 'symlink', 'hardlink', 'index']) {
		withFixture(`metadata-${change}`, tempRoot => {
			const repository = path.join(tempRoot, 'repository');
			copyRepository(repository);
			const tools = createTools(tempRoot, repository);
			if (change === 'mode') {
				runGit(repository, ['config', 'core.filemode', 'false']);
				fs.chmodSync(path.join(repository, 'README.md'), 0o755);
			} else if (change === 'symlink') {
				fs.rmSync(path.join(repository, 'tracked-readme-link'));
				fs.symlinkSync('CHANGES.md', path.join(repository, 'tracked-readme-link'));
			} else if (change === 'hardlink') {
				const readme = path.join(repository, 'README.md');
				fs.rmSync(readme);
				fs.linkSync(path.join(repository, 'CHANGES.md'), readme);
			} else {
				fs.appendFileSync(path.join(repository, 'README.md'), '\nstaged change\n');
				runGit(repository, ['add', 'README.md']);
			}
			const result = runLauncher(repository, [repository, 'check'], tempRoot, tools);
			assert.equal(result.status, 2, `${change}\n${result.stdout}\n${result.stderr}`);
			assert.deepEqual(readCommands(tools.log), []);
		});
	}
});

for (const mode of ['direct', 'symlink']) {
	test(`launcher fails closed when ${mode} repository is replaced after validation`, () => {
		withFixture(`swap-${mode}`, tempRoot => {
			const selected = path.join(tempRoot, 'selected');
			const old = path.join(tempRoot, 'old');
			const replacement = path.join(tempRoot, 'replacement');
			const marker = path.join(tempRoot, 'swap-marker');
			copyRepository(selected);
			copyRepository(replacement);
			fs.appendFileSync(path.join(replacement, 'Makefile'), `\n$(shell touch ${marker})\n`);
			commitRepository(replacement);
			const originalMakefile = fs.readFileSync(path.join(selected, 'Makefile'), 'utf8');
			fs.rmSync(path.join(selected, 'Makefile'));
			spawnSync('mkfifo', [path.join(selected, 'Makefile')]);
			const repository = mode === 'symlink' ? path.join(tempRoot, 'repository-link') : selected;
			if (mode === 'symlink') fs.symlinkSync(selected, repository, 'dir');
			const tools = createTools(path.join(tempRoot, 'tools'), replacement);
			const helper = spawn(process.execPath, ['-e', `
				const fs = require('node:fs');
				const fd = fs.openSync(${JSON.stringify(path.join(selected, 'Makefile'))}, 'w');
				fs.renameSync(${JSON.stringify(selected)}, ${JSON.stringify(old)});
				fs.renameSync(${JSON.stringify(replacement)}, ${JSON.stringify(selected)});
				fs.writeFileSync(fd, ${JSON.stringify(originalMakefile)});
				fs.closeSync(fd);
			`], { stdio: 'inherit' });
			const result = runLauncher(sourceRepository, [repository, 'check'], tempRoot, tools);
			if (helper.exitCode === null) helper.kill();
			assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
			assert.equal(fs.existsSync(marker), false);
			assert.deepEqual(readCommands(tools.log), []);
		});
	});
}

test('private targets require launcher context while trusted make check remains compatible', () => {
	for (const make of ['make', 'gmake']) {
		if (spawnSync('sh', ['-c', `command -v ${make}`]).status !== 0) continue;
		withFixture(`private-${make}`, tempRoot => {
			const repository = path.join(tempRoot, 'repository');
			copyRepository(repository);
			let tools = createTools(path.join(tempRoot, 'private'), repository, make);
			let result = runRawMake(make, ['-C', repository, '__chrome_blocker_check'], tempRoot, tools);
			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /validated Node launcher/);
			assert.deepEqual(readCommands(tools.log), []);

			tools = createTools(path.join(tempRoot, 'trusted'), repository, make);
			result = runRawMake(make, ['-C', repository, 'check'], tempRoot, tools);
			assert.equal(result.status, 0, `${make}\n${result.stdout}\n${result.stderr}`);
			assertSnapshotCommands(readCommands(tools.log), 'check');
		});
	}
});

test('private targets support GNU Make 3.81 and 4.4.1 while launcher propagates gate failure', () => {
	for (const make of ['make', 'gmake']) {
		if (spawnSync('sh', ['-c', `command -v ${make}`]).status !== 0) continue;
		withFixture(`versions-${make}`, tempRoot => {
			const repository = path.join(tempRoot, 'repository');
			copyRepository(repository);
			const tools = createTools(tempRoot, repository);
			const result = runRawMake(make, ['-C', repository, '__chrome_blocker_check'], tempRoot, tools);
			assert.notEqual(result.status, 0);
		});
	}
	withFixture('launcher-failure', tempRoot => {
		const repository = path.join(tempRoot, 'repository');
		copyRepository(repository);
		const tools = createTools(tempRoot, repository);
		const result = runLauncher(repository, [repository, 'check'], tempRoot, tools, {
			CHROME_BLOCKER_FAIL_SCRIPT: 'test-content-script.js'
		});
		assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
		const commands = readCommands(tools.log);
		assert.notEqual(commands.length, 0);
		assert.deepEqual(commands, expectedCommands(commands[0].cwd, 'check').slice(0, 3));
	});
});
