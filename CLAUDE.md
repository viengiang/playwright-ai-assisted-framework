# CLAUDE.md — repository conventions

These rules apply to every contributor, human or AI agent. Requirements live in
[docs/BRIEF.md](docs/BRIEF.md) and the approved plan in [docs/PLAN.md](docs/PLAN.md). Read
[docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) before changing tests: several ParaBank defects
explain choices that look odd without that context.

## Stack

- Playwright Test + TypeScript (strict). Node 22 (`nvm use`).
- System under test: ParaBank (UI + REST API). Default `ENV=local` targets Docker
  (`npm run env:up`), as CI does. `ENV=public` targets the shared demo: opt-in, for occasional
  smoke runs only (it rate-limits bursts of sign-ups, see KNOWN-ISSUES #6).
- zod for API response schemas, @faker-js/faker for test data.

## Commands

```bash
npm run env:up        # start local ParaBank in Docker (port 8090, PARABANK_PORT to change)
npm run env:down
npm run check         # prettier --check + eslint + tsc (what CI's quality job runs)
npm test              # all projects
npm run test:api      # API project only
npm run test:ui       # UI projects (chromium, firefox, webkit, mobile-chrome)
npm run test:smoke    # @smoke only
npm run test:regression
npm run report        # open the last HTML report
```

Before committing: `npm run check` and `npm test` (local Docker) must pass.

## Layout

| Path                                  | Contains                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `src/config/`                         | Typed env (`env.ts`) and global setup. Only `env.ts` reads `process.env`. |
| `src/fixtures/`                       | The `test` / `expect` that specs import, plus all fixtures.               |
| `src/ui/pages/`, `src/ui/components/` | Page objects. Locators + user-level actions only.                         |
| `src/api/client/`                     | HTTP wrapper around `APIRequestContext`.                                  |
| `src/api/models/`                     | zod schemas + inferred types (`type X = z.infer<typeof XSchema>`).        |
| `src/api/builders/`                   | Fluent builders for request payloads.                                     |
| `src/api/services/`                   | One class per resource; methods map 1:1 to endpoints.                     |
| `src/data/builders/`                  | Test data builders (faker, unique values).                                |
| `src/utils/`                          | Small pure helpers (e.g. money in cents).                                 |
| `tests/ui/`, `tests/api/`             | Specs.                                                                    |
| `specs/`                              | Vendored OpenAPI spec + `SPEC-DRIFT.md`.                                  |

Import through the path aliases in `tsconfig.json` (`@fixtures`, `@pages/*`, `@api/*`, …).

## Fixtures

| Fixture                                                                                     | Gives you                                                              |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `api`                                                                                       | `{ customers, accounts, transfers }` services on the REST API.         |
| `customer`                                                                                  | A new customer registered over HTTP. The browser is **not** logged in. |
| `signedInCustomer`                                                                          | A new customer whose session is already in the browser context.        |
| `loginPage`, `registerPage`, `accountsOverviewPage`, `openAccountPage`, `transferFundsPage` | Page objects.                                                          |

Use `signedInCustomer` for any UI test that isn't about logging in. Arrange preconditions (extra
accounts, balances) through `api`, not the UI.

## Test rules

- Import `test` and `expect` from `@fixtures`, never from `@playwright/test` (ESLint enforces it).
- **No hard waits.** No `waitForTimeout`, `setTimeout`, `waitForSelector` or `networkidle`. Use
  web-first assertions (`await expect(locator).toBeVisible()`), which retry automatically.
- **Locator order:** `getByRole` → `getByLabel` → `getByText` / `getByTestId` → CSS (`#id`,
  `[name=…]`) only when the app offers nothing better, with a one-line comment saying why. Many
  ParaBank form fields have no accessible name (KNOWN-ISSUES #4), so `#id` is expected there.
  Never XPath. No positional selectors (`nth`, `:nth-child`) unless position is what's under test.
- Locators live in page objects, not specs. Page objects may wait for readiness, but assertions
  about business outcomes belong in specs.
- No `force: true`, no `test.only`, no `test.skip`, no conditional logic in tests (ESLint enforces it).
- **Data isolation:** each test creates its own customer through a fixture. Never rely on seeded
  users (`john/demo`) or shared accounts. Never call admin endpoints (`/cleanDB`, `/initializeDB`,
  `/setParameter`) against the public instance.
- **Assert deltas, not defaults:** compare before/after balances. Compare money in integer cents
  (`toCents`), and format expected UI values with `formatUsd`.
- **Verify behaviour, not just the UI message.** After a UI action that changes state, confirm
  the state through `api` as well.
- **Do not raise `workers`.** ParaBank is not safe for concurrent use (KNOWN-ISSUES #1). Scale out
  with shards, each with its own instance.
- Tag every test: `{ tag: '@smoke' }` (critical path) or `{ tag: '@regression' }`.
- A test for a confirmed ParaBank defect uses `test.fail()`, the `@known-defect` tag and an
  annotation linking to `docs/KNOWN-ISSUES.md`. Never weaken an assertion to make a test pass.
- JSON responses are validated with their zod schema in the service layer (`client.parse`).
  If the API deviates from the spec, model the observed behaviour and record it in
  `specs/SPEC-DRIFT.md`.
- Service methods named `*Response` return the raw `APIResponse` for negative tests. The others
  return parsed, typed data and throw on a non-2xx status.
- Test titles: `should <outcome> when <condition>` (ESLint requires the `should ` prefix).

## Code style

- TypeScript strict; no `any`, no non-null `!`.
- Prettier formats; ESLint must be clean (`--max-warnings=0`).
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `refactor:`.

## Secrets

- Never commit secrets. Configuration comes from env vars; document new ones in `.env.example`.
- Test credentials are generated per test run; none are stored in the repo.
