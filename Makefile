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
	docker-compose down

## clean:  Stop and remove both containers and data volumes
clean:
	docker-compose down -v

## wipe:  Stop and remove both containers and data volumes, then erase service images
wipe:
	- docker-compose down -v
	- docker image rm -f $(docker-compose images)

.PHONY: test
## test:  Execute unit tests
test:
	docker-compose -p test -f docker-compose.test.yml run --rm --no-deps test npm run test

.PHONY: e2e
## e2e:   Execute end to end tests
e2e:
	- docker-compose -p test -f docker-compose.test.yml run test npm run test:e2e
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

