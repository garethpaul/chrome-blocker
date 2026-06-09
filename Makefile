.PHONY: build check lint test verify

NODE ?= node

lint:
	scripts/check-baseline.sh

test:
	$(NODE) scripts/test-url-rules.js

build: lint

verify: lint test build

check: verify
