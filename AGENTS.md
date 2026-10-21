# AGENTS.md

Universiteams API: a platform for university research projects. Students and teachers publish projects; others browse them and request to join. NestJS 10, TypeORM, Postgres, Redis (Bull queues), Docker. The frontend lives in [team120/Universiteams-front](https://github.com/team120/Universiteams-front).

## Running checks

Tooling runs inside Docker; the host has no `node_modules`.

- Unit tests: `make test` (coverage: `make cov`)
- E2E tests: `make e2e` (needs `docker.test.env`, created by `./create-test-env-file.sh`)
- Lint and format: CI runs `eslint` and `prettier --check` on `src/` and `test/`

## Conventions

- Commits and PR titles follow Conventional Commits. PRs are squash-merged.
- Code, comments, commits, and docs are in English. API messages returned to users are in Spanish.
- Every variable is documented in `docker.dev.env.example`. Env files are never committed.

## Review guidelines

Flag these as issues:

- A bug fix without a regression test that would fail without the fix.
- New logic without unit tests, or an endpoint change without an e2e test in `test/`.
- New `any` types, or type assertions that hide a real type mismatch.
- User-facing API messages (exceptions, validation messages) not in Spanish.
- Secrets, tokens, or credentials in code, logs, fixtures, or committed env files.
- Entity changes without a TypeORM migration, or migrations that drop or alter data without saying so in the PR.
- Endpoints missing authentication or authorization checks that similar endpoints have.
- Queries built by string concatenation instead of parameters.
- Behavior or setup changes without updates to `README.md` or `docker.dev.env.example`.
- New dependencies without a reason in the PR description.
- Changes that go beyond the PR's stated scope.

Don't flag formatting or lint style; CI enforces those.
