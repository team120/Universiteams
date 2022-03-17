# Universiteams

This project was thought in order to facilitate the creation, management and formalization of university research projects. Both students and teachers will be able to organize their projects, which will be visible to other students who may want to join the research team.
It mainly consists of a web application, the main page will contain all the projects in order to make them known for everyone, and they will be accepting requests for those who want to get in.

#### Our main purpose is to facilitate and promote scientific dissemination.

## Prerequisites
### Make
Only in case you happen to use Windows install [Chocolatey package manager](https://chocolatey.org/install)
Then install Make with the following command:
```bash
$ choco install make
```
### Docker
[https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

### NPM
> Just if you happen to use VSCode linter and formatter extensions
> Alternatively, using VSCode remote docker container extension might provide the same experience

[https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Local Environment
### Setup and Running the app
```bash
$ make dev
```
> Migrations are executed by default when the app is bootstrapping

### Access
#### API
[api.localhost](http://api.localhost)
### DB Admin
[db.localhost](https://db.localhost)

### Teardown
```bash
$ make down-dv
```

## Production Environment
### Setup and Running the app
```bash
$ make prod
```

### Access
[api.universiteams.com](https://api.universiteams.com)
[universiteams.com](https://universiteams.com)

### Teardown
```bash
$ make down-pd
```

## Test

```bash
# unit tests
$ make test

# unit test [interactive debug mode]
make test-dg

# unit test coverage
$ make cov

# e2e tests
$ make e2e

# e2e tests [non-interactive debug mode]
$ make e2e-dg name="jest_test_partial_description"
```

## Lint

```bash
make lint
```

## Format

```bash
make format
```

## Backend Tech Stack

### Common

| Tool                                            |
| :---------------------------------------------- |
| :ballot_box_with_check: JavaScript / TypeScript |

### Backend

| Tool                               |
| :--------------------------------- |
| :ballot_box_with_check: Express    |
| :ballot_box_with_check: NestJS     |
| :ballot_box_with_check: TypeORM    |
| :ballot_box_with_check: PostgreSQL |
| :ballot_box_with_check: Docker     |

## Authors

| Name               | GitHub Account                             |
| :----------------- | :----------------------------------------- |
| Recalde, Alejandro | :octocat: https://github.com/alereca       |
| Antonelli, Nicolás | :octocat: https://github.com/NicoAntonelli |
| Acciarri, Joshua   | :octocat: https://github.com/JAcciarri     |