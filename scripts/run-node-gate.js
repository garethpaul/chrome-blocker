#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const target = process.argv[2];
if (process.argv.length !== 3 || (target !== 'lint' && target !== 'test')) fail();

let root;
try {
	const contextPath = process.env.CHROME_BLOCKER_LAUNCH_CONTEXT;
	const token = process.env.CHROME_BLOCKER_LAUNCH_TOKEN;
	if (!contextPath || !token) fail();
	const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
	if (typeof context.root !== 'string' || typeof context.token !== 'string') fail();
	const actualToken = Buffer.from(token);
	const expectedToken = Buffer.from(context.token);
	if (actualToken.length !== expectedToken.length || !crypto.timingSafeEqual(actualToken, expectedToken)) fail();
	root = fs.realpathSync(process.cwd());
	if (root !== context.root) fail();
	const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
	const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
	if (manifest.name !== 'GetToWork' || manifest.version !== '0.01' ||
		!/^CHROME_BLOCKER_REPOSITORY_MAKEFILE := 1$/m.test(makefile)) fail();
} catch {
	fail();
}

if (target === 'lint') {
	const shell = process.env.CHROME_BLOCKER_SH;
	if (!shell) fail();
	process.exit(run(shell, [path.join(root, 'scripts', 'check-baseline.sh')]));
}

const node = process.env.CHROME_BLOCKER_NODE;
if (!node) fail();
for (const file of [
	'test-url-rules.js',
	'test-content-script.js',
	'test-background.js',
	'test-blocked-site.js',
	'test-popup.js'
]) {
	const status = run(node, [path.join(root, 'scripts', file)]);
	if (status !== 0) process.exit(status);
}
process.exit(0);

function run(command, args) {
	const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
	if (result.error) {
		console.error(result.error.message);
		return 127;
	}
	return result.status === null ? 1 : result.status;
}

function fail() {
	console.error('Unable to verify the Chrome Blocker launcher context.');
	process.exit(2);
}
