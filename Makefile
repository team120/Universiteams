all: help
##	Available commands:

SHELL:=/bin/bash

help: Makefile
	@sed -n 's/^##//p' $<

# .PHONY: A phony target is one that is not really the name of a file; 
# rather it is just a name for a recipe to be executed when you make an explicit request.

## up:	Bootstrap environment
up:
	docker-compose up --detach --remove-orphans

## down:  Tear down enviroment
down:
	- docker-compose down
	- sudo rimraf dist

## clean:  Stop and remove both containers and data volumes
clean:
	- docker-compose down -v
	- sudo rimraf dist

## wipe:  Erase universiteams service image
wipe:
	- docker-compose down
	- docker image rm -f $(shell docker image ls -q "*/universiteams")

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
	docker-compose run --rm --no-deps app npm run lint

.PHONY: format
## format:   Run prettier
format:
	docker-compose run --rm --no-deps app npm run format

