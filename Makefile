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

.PHONY: test
## test:  Execute unit tests
test:
	docker-compose -p test -f docker-compose.test.yml run --rm --no-deps test npm run test

.PHONY: e2e
## e2e:   Execute end to end tests
e2e:
	- docker-compose -p test -f docker-compose.test.yml run test npm run test:e2e
	- docker-compose -p test -f docker-compose.test.yml down -v

logs:
	docker-compose logs -f

