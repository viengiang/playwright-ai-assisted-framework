# Approved Plan

Approved 2026-09-29. Requirements: [BRIEF.md](BRIEF.md). Conventions: [../CLAUDE.md](../CLAUDE.md).

## System under test: ParaBank (UI + REST API)

Parasoft's public demo bank. Chosen because banking flows (login, accounts, transfers, bill pay)
match the FinTech domain, and one coherent SUT reads better than several unrelated demos.

| Item        | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Public UI   | https://parabank.parasoft.com/parabank/index.htm                      |
| REST base   | https://parabank.parasoft.com/parabank/services/bank                  |
| OpenAPI     | `…/services/bank/openapi.yaml` (OpenAPI 3.0.1) — vendored in `specs/` |
| Self-hosted | Docker image `parasoft/parabank`                                      |

### Reachability check (2026-09-29)

Registered a fresh user via the HTML form, logged in via API, created an account, transferred $10
— all succeeded. Invalid login and unknown account both return `400` with a plain-text message.

### Known risks and mitigations

| Risk                                                                                                                                                                                         | Mitigation                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared public DB; `/cleanDB`, `/initializeDB`, `/setParameter` are open to anyone, so seed data and default balances can change at any time (observed: new customer $515.50, new account $0) | Every test registers its **own** customer; assert **balance deltas**, never absolute defaults; never depend on `john/demo`; framework never calls admin endpoints on the public instance |
| Public instance availability                                                                                                                                                                 | CI runs against the Docker image as a service container; local default = public URL, `npm run env:up` switches to Docker                                                                 |
| Form labels are not associated with inputs (label text in a separate `<td>`) → `getByLabel` fails                                                                                            | Page objects use `#id` / `[name=…]` for those inputs as a documented exception; buttons/links still use `getByRole`                                                                      |
| Some endpoints return `text/plain` (e.g. `/transfer`)                                                                                                                                        | Schema validation applies to JSON endpoints (customer, accounts, transactions); spec/behaviour drift is documented                                                                       |
| No REST endpoint for registration                                                                                                                                                            | Customers created by POSTing the register form via Playwright's `request` context (no browser)                                                                                           |

### Fallbacks

1. ParaBank Docker image (local + CI).
2. Practice Software Testing ("Toolshop") — UI + OpenAPI 3.2 API, JWT auth, Docker-able.
3. Swagger Petstore v3 — API only; shared writable state, last resort.

## Repository

- Name: `playwright-ai-assisted-framework` (subfolder of the working directory, own git repo).
- Node 22 LTS (pinned in `.nvmrc`), npm.

```
.github/workflows/ci.yml     lint+typecheck → API tests → UI tests (sharded) → merged HTML report
.claude/commands/            Phase 2: thin wrappers exposing ai/*.md as slash commands
.mcp.json                    Phase 2: Playwright MCP
ai/                          Phase 2: versioned, tool-agnostic AI workflows
CLAUDE.md                    conventions for humans and AI agents
docs/                        BRIEF, PLAN, ai-workflow-example
specs/                       vendored OpenAPI spec
src/config/                  typed, validated env
src/fixtures/                test.extend: page objects, API services, per-test customer
src/ui/pages, src/ui/components
src/api/client, models (zod), builders, services
src/data/builders            faker-based test data
tests/ui, tests/api
```

## Key design decisions

- **Projects:** `api` (no browser, `tests/api`); `chromium`, `firefox`, `webkit` (`tests/ui`);
  `mobile-chrome` runs `@smoke` only (ParaBank is not responsive).
- **Auth for UI tests:** a fixture registers a customer via HTTP and injects the session cookie;
  only login tests use the login form.
- **Cross-layer assertions:** UI transfer test verifies balances via the API service.
- **Rules enforced by tooling:** `eslint-plugin-playwright` (no `waitForTimeout`, no `force`,
  web-first assertions), strict `typescript-eslint`; CI fails on violations.
- **Schemas:** zod — one source for TS types and runtime validation. Trade-off: schemas are
  hand-maintained against the vendored spec (the `generate-api-tests` workflow covers this).
- **Tags:** `@smoke`, `@regression` via Playwright tag syntax; `npm run test:smoke` /
  `test:regression`.
- **Planned tests:**
  - UI: valid login, invalid login error, registration validation errors, transfer between own
    accounts, open new account.
  - API: customer schema, accounts of a new customer, create account, transfer (balance deltas +
    transaction recorded), negatives (unknown account / invalid login → 400).
- **Phase 2:** `ai/*.md` is canonical (version header, inputs, steps, conventions, output
  checklist); `.claude/commands/` references them.
- **No invented claims:** only a real GitHub Actions status badge, added once the repo is pushed.

## Decisions from review

- Node: use the Node 22 LTS already installed via nvm.
- Repo lives in a subfolder of the working directory.
- `gh` CLI installed via Homebrew; the author authenticates (`gh auth login`) themselves.
- Public docs use neutral wording (no sales framing).

## Changes during Phase 1

- **`workers: 1` per ParaBank instance.** ParaBank turned out not to be safe for concurrent use
  (id collisions on sign-up/createAccount, view state leaking between sessions — see
  [KNOWN-ISSUES.md](KNOWN-ISSUES.md) #1). A cross-worker file lock around creations was tried
  and dropped: the collisions also involve transactions, and the session leak affects page reads,
  so no narrow lock is enough. Parallelism comes from CI shards, each with its own container.
- **Local Docker port is 8090** (`PARABANK_PORT`), so it doesn't clash with other local services on 8080.
- **Global setup** seeds a fresh Docker DB once (REST `initializeDB`, idempotent, local only) and
  fails fast with a clear message if the target is unreachable.
- **TypeScript 6.0**, not 7: `typescript-eslint` supports `<6.1`.
- **Spec drift** is documented in `specs/SPEC-DRIFT.md`; models follow observed behaviour.
- **Known ParaBank defect** (negative transfer amounts accepted) is covered by a `test.fail()`
  test tagged `@known-defect`.
- **Public instance** sits behind Cloudflare and served a bot challenge after about 30 sign-ups
  in a burst. **Default `ENV` is now `local`** (Docker; approved after Phase 1). `ENV=public`
  stays available as an opt-in for occasional smoke runs.
