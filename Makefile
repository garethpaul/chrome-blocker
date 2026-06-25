SHELL := /bin/sh

CHROME_BLOCKER_REPOSITORY_MAKEFILE := 1

.PHONY: lint test build verify check
.PHONY: __chrome_blocker_lint __chrome_blocker_test __chrome_blocker_build
.PHONY: __chrome_blocker_verify __chrome_blocker_check

ifneq ($(filter __chrome_blocker_%,$(MAKECMDGOALS)),)
ifneq ($(origin CHROME_BLOCKER_LAUNCH_CONTEXT),environment)
$(error Private Chrome Blocker targets require the validated Node launcher)
endif
ifneq ($(origin CHROME_BLOCKER_LAUNCH_TOKEN),environment)
$(error Private Chrome Blocker targets require the validated Node launcher)
endif
override CHROME_BLOCKER_LAUNCH_CONTEXT := $(value CHROME_BLOCKER_LAUNCH_CONTEXT)
override CHROME_BLOCKER_LAUNCH_TOKEN := $(value CHROME_BLOCKER_LAUNCH_TOKEN)
override CHROME_BLOCKER_NODE := $(value CHROME_BLOCKER_NODE)
override CHROME_BLOCKER_SH := $(value CHROME_BLOCKER_SH)
export CHROME_BLOCKER_LAUNCH_CONTEXT
export CHROME_BLOCKER_LAUNCH_TOKEN
export CHROME_BLOCKER_NODE
export CHROME_BLOCKER_SH
endif

lint:
	@node scripts/run-make.js . lint

test:
	@node scripts/run-make.js . test

build:
	@node scripts/run-make.js . build

verify:
	@node scripts/run-make.js . verify

check:
	@node scripts/run-make.js . check

__chrome_blocker_lint:
	@"$(CHROME_BLOCKER_NODE)" scripts/run-node-gate.js lint

__chrome_blocker_test:
	@"$(CHROME_BLOCKER_NODE)" scripts/run-node-gate.js test

__chrome_blocker_build: __chrome_blocker_lint

__chrome_blocker_verify: __chrome_blocker_lint __chrome_blocker_test __chrome_blocker_build

__chrome_blocker_check: __chrome_blocker_verify
