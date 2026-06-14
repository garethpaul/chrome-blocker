.PHONY: build check lint test verify

NODE ?= node
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

lint:
	$(ROOT)scripts/check-baseline.sh

test:
	$(NODE) $(ROOT)scripts/test-url-rules.js
	$(NODE) $(ROOT)scripts/test-background.js
	$(NODE) $(ROOT)scripts/test-blocked-site.js
	$(NODE) $(ROOT)scripts/test-popup.js

build: lint

verify: lint test build

check: verify
