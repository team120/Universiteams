# Universiteams

[![dockeri.co](https://dockeri.co/image/universiteams/api)](https://hub.docker.com/r/universiteams/api)

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

#### DB Admin

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

### Teardown

```bash
$ make down-pd
```

## Test

```bash
# unit tests
$ make test

# unit test [interactive debug mode]
$ make test-dg

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

## Technologies used

### Frontend

| Name                              | How it contributes to the project              |
| :-------------------------------- | :--------------------------------------------- |
| :necktie: TypeScript              | Programming language that builds on JavaScript |
| :rocket: Next.js                  | Fullstack framework for React.js               |
| :basket: Mantine                  | Really cool component library                  |
| :bone: HTML5 & CSS3               | The basics for the web!                        |
| :art: Sass CSS                    | Simple stylization                             |
| :framed_picture: Tabler Icons     | Icons Mantine-compatible                       |
| :paintbrush: Prettier             | Nice code formatter                            |
| :triangular_ruler: ESLint         | Complete linter with strict rules              |
| :guide_dog: Husky                 | Git hooks to assure quality commits            |
| :test_tube: Jest                  | Easy unit testing                              |
| :package: TurboPack               | JavaScript very fast bundler                   |
| :page_with_curl: GitHub Actions   | CI/CD automation                               |
| :arrow_up_small: Deploy in Vercel | Deployment is very important!                  |

### Backend

| Name                               | How it contributes to the project                             |
| :--------------------------------- | :------------------------------------------------------------ |
| :necktie: TypeScript               | Programming language that builds on JavaScript                |
| :green_book: Node.js               | JavaScript runtime built on V8 JavaScript engine              |
| :cat: Nest.js                      | Framework for building efficient, scalable Node.js web apps   |
| :world_map: TypeORM                | Object-relational mapping (ORM) tool for Node.js              |
| :card_file_box: PostgreSQL         | Open-source relational database management system (RDBMS)     |
| :floppy_disk: JSON Web Token (JWT) | Compact and self-contained way for securely transmitting info |
| :paintbrush: Prettier              | Nice code formatter                                           |
| :triangular_ruler: ESLint          | Complete linter with strict rules                             |
| :test_tube: Jest                   | Easy unit testing                                             |
| :alembic: Supertest                | High-level HTTP abstraction for E2E integration testing       |
| :open_book: Swagger                | Interactive, machine and human-readable API documentation     |
| :gear: Traefik                     | HTTP reverse proxy and load balancer                          |
| :whale: Docker                     | Separates the app from the infrastructure with containers     |
| :cloud: Terraform                  | Infrastructure as code tool to manage the infra in any cloud  |
| :airplane: New Relic               | Monitor and analyze deployments                               |
| :droplet: DigitalOcean Droplet     | Deploy in scalable cloud virtual machines                     |

## Authors

| Name                        | GitHub Account                          |
| :-------------------------- | :-------------------------------------- |
| :octocat: Alejandro Recalde | :link: https://github.com/alereca       |
| :octocat: Nicolás Antonelli | :link: https://github.com/NicoAntonelli |
| :octocat: Joshua Acciarri   | :link: https://github.com/JAcciarri     |
