all: help
##	Available commands:

SHELL:=/bin/bash

help: Makefile
	@sed -n 's/^##//p' $<

# .PHONY: A phony target is one that is not really the name of a file; 
# rather it is just a name for a recipe to be executed when you make an explicit request.

## dev:	Bootstrap dev environment
dev:
	- docker-compose -p dev -f docker-compose.dev.yml build
	- docker-compose -p dev -f docker-compose.dev.yml up --detach --remove-orphans

## prod: Bootstrap prod environment
prod:
	- docker-compose -p prod -f docker-compose.prod.yml build
	- docker-compose -p prod -f docker-compose.prod.yml up --remove-orphans

## down-dv: Tear down dev enviroment without deleting data volumes
down-dv:
	- docker-compose -p dev -f docker-compose.dev.yml down
	- sudo rimraf dist

## down-pd: Tear down prod enviroment without deleting data volumes
down-pd:
	docker-compose -p prod -f docker-compose.prod.yml down

## clean-dv: Stop and remove both containers and data volumes from dev environment
clean-dv:
	- docker-compose -p dev -f docker-compose.dev.yml down -v
	- sudo rimraf dist

## clean-pd: Stop and remove both containers and data volumes from prod environment
clean-pd:
	docker-compose -p prod -f docker-compose.prod.yml down -v

## wipe: Erase universiteams service image
wipe:
	- docker-compose -p dev -f docker-compose.dev.yml down
	- docker-compose -p prod -f docker-compose.prod.yml down
	- docker image rm -f $(shell docker image ls --filter label=org.opencontainers.image.vendor=universiteams -q)

.PHONY: test
## test:  Execute unit tests
test:
	docker-compose -p test -f docker-compose.test.yml run --rm --no-deps test npm run test

.PHONY: test-dg
## test-dg (test-debug):  Execute unit tests in debug mode
test-dg:
	docker-compose -p test -f docker-compose.test.yml run --service-ports --rm --no-deps test npm run test:debug

.PHONY: e2e
## e2e:   Execute end to end tests
e2e:
	- docker-compose -p test -f docker-compose.test.yml run test npm run test:e2e
	- docker-compose -p test -f docker-compose.test.yml down -v

.PHONY: e2e-dg
## e2e-dg (e2e-debug):   Execute end to end tests in debug mode
e2e-dg:
	- docker-compose -p test -f docker-compose.test.yml run --service-ports test npm run test:e2e:debug --name="$(name)"
	- docker-compose -p test -f docker-compose.test.yml down -v

.PHONY: cov
## cov:   Show test test coverage info
cov:
	docker-compose -p test -f docker-compose.test.yml run --rm --no-deps test npm run test:cov

.PHONY: logs
## logs:   Show logs for every declared service
logs:
	docker-compose logs -f

.PHONY: lint
## lint:   Run eslint in fix mode
lint:
	docker-compose -p dev -f docker-compose.dev.yml run --rm --no-deps app npm run lint

.PHONY: format
## format:   Run prettier
format:
	docker-compose -p dev -f docker-compose.dev.yml run --rm --no-deps app npm run format

