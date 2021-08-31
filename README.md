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
> Just for executing the formatter and linter

[https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Project Setup and Running the app
```bash
$ make up
```
> Migrations are executed by default when the app is bootstrapping


## Project Teardown
```bash
$ make down
```

## Test

```bash
# unit tests
$ make test

# e2e tests
$ make e2e

# test coverage
$ make cov
```

## Lint

```bash
make lint
```

## Format

```bash
make format
```

## Tech Stack

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

### Frontend

| Tool                                        |
| :------------------------------------------ |
| :ballot_box_with_check: Angular 11          |
| :ballot_box_with_check: Angular Material    |
| :ballot_box_with_check: Angular Flex Layout |
| :ballot_box_with_check: HTML5 / CSS3 / SASS |

## Authors

| Name               | GitHub Account                             |
| :----------------- | :----------------------------------------- |
| Recalde, Alejandro | :octocat: https://github.com/alereca       |
| Antonelli, Nicolás | :octocat: https://github.com/NicoAntonelli |
| Acciarri, Joshua   | :octocat: https://github.com/JAcciarri     |
