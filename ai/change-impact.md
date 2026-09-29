---
id: change-impact
version: 1.0.0
updated: 2026-09-29
---

# Change impact analysis

Reads a git diff and answers three questions: **what is affected, which tests to run, and which
tests to update or add.** The goal is a targeted run with a stated reason for each choice, instead
of "run everything and hope".

## Inputs

| Input      | Required | Default                                         |
| ---------- | -------- | ----------------------------------------------- |
| Diff range | no       | `origin/main...HEAD` (plus uncommitted changes) |

## Steps

### 1. Collect the change

```bash
git diff --name-status origin/main...HEAD
git diff --name-status            # uncommitted
git diff origin/main...HEAD -- <file>   # read the hunks for anything non-trivial
```

### 2. Classify each changed file

| Changed path                                                            | Blast radius                                                              | Default run                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| `playwright.config.ts`, `src/config/`, `package*.json`, `tsconfig.json` | Everything                                                                | Full suite                      |
| `src/fixtures/index.ts`                                                 | Every spec using the changed fixture                                      | Specs that destructure it       |
| `src/api/client/`                                                       | All API calls (API specs and UI specs that verify via `api`)              | Full suite                      |
| `src/api/models/<x>.model.ts`                                           | Services that parse with it, and their callers                            | Consumer specs (search imports) |
| `src/api/services/<x>.service.ts`                                       | Specs calling the changed methods, including via fixtures                 | Consumer specs                  |
| `src/api/builders/`                                                     | Specs using the builder                                                   | Consumer specs                  |
| `src/ui/pages/`, `src/ui/components/`                                   | Specs using that page object (via fixture) or component (via `menu` etc.) | Consumer specs, all browsers    |
| `src/utils/`, `src/data/`                                               | Callers                                                                   | Consumer specs                  |
| `tests/**`                                                              | The spec itself                                                           | That spec, `--repeat-each=3`    |
| `specs/parabank-openapi.yaml`                                           | Models may now disagree with the contract                                 | API suite + model review        |
| `.github/`, `eslint.config.mjs`, docs                                   | No runtime effect                                                         | `npm run check` only            |

### 3. Trace consumers, don't guess

For each changed symbol, find its real consumers:

```bash
grep -rn "<ClassOrFunction>" src tests
grep -rn "<fixtureName>" tests          # fixtures are used by name in test signatures
```

Remember indirect paths: a page object reaches specs through a fixture, a model reaches specs
through a service, and a component (e.g. `AccountServicesMenu`) reaches every page through
`BasePage`.

### 4. Decide what to run

Produce exact commands. Prefer file paths and `--grep` over "run all":

```bash
npx playwright test tests/ui/transfer-funds.spec.ts tests/api/transfers.spec.ts
npx playwright test --grep "@smoke"
```

Escalate to the full suite when a row in step 2 says "Everything", or when you can't bound the
impact with confidence. Say which of the two applies.

### 5. Find test gaps

For behaviour the diff changes or adds, check whether a test asserts it. List:

- **Tests to update:** existing tests whose expectations the change invalidates (quote the line)
- **Tests to add:** new or changed behaviour with no assertion covering it

## Output

```md
## Change impact: <range>

**Risk:** low | medium | high — <one-line reason>

### Changed

| File | Change | Affected area |

### Run

<commands>, with one line on why this set is sufficient

### Update

- <spec:line> — <why>

### Add

- <scenario> — <which layer (UI/API) and why>
```

## Output checklist

- [ ] Every changed file is classified
- [ ] Consumers were found with `grep`, including fixture and `BasePage` paths
- [ ] Commands are copy-pasteable; the full suite is used only with a stated reason
- [ ] Gaps list specific scenarios, not "add more tests"
- [ ] Config/fixture/client changes escalate to the full suite
