---
id: generate-ui-test
version: 1.0.0
updated: 2026-09-29
---

# Generate a UI test from a user story

Turns a user story into Playwright UI tests that follow this repo's page objects, fixtures and
locator rules. The agent explores the real app through **Playwright MCP** before writing code, so
locators and messages come from what the app renders, not from guesses.

The output is a **draft for human review** ([review-ai-tests.md](review-ai-tests.md)). It is not
merged without that review.

## Inputs

| Input               | Required | Example                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------ |
| User story          | yes      | "As a customer I want to pay a bill so that the payee gets paid."        |
| Acceptance criteria | no       | Bullet list. If missing, derive them in step 1 and mark them as derived. |
| Target instance     | no       | Defaults to the local Docker instance (`npm run env:up`).                |

## Before you start

1. Read [CLAUDE.md](../CLAUDE.md) and [docs/KNOWN-ISSUES.md](../docs/KNOWN-ISSUES.md). They are
   binding. Where this file and CLAUDE.md disagree, CLAUDE.md wins.
2. List what already exists: `src/ui/pages/`, `src/ui/components/`, `src/fixtures/index.ts`,
   `tests/ui/`. Reuse before creating.
3. Make sure ParaBank is up: `npm run env:up`. Explore **only** the local instance
   (`http://localhost:8090/parabank/`), never the public demo.

## Steps

### 1. Turn the story into scenarios

Write a short table before touching the browser:

| #   | Scenario | Type (happy/negative/edge) | Observable outcome that proves it |
| --- | -------- | -------------------------- | --------------------------------- |

- Every scenario needs an outcome you can check: a state change (balance, new record), an exact
  message, or data retrievable through the API. "The page loads" is not an outcome.
- Aim for the smallest set that covers the story: usually one happy path plus the negatives that
  protect money or data. Do not pad.
- If the story is ambiguous, write the question down and pick the most conservative reading. Do
  not invent business rules.

### 2. Explore the app with Playwright MCP

Use only these tools: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`,
`browser_fill_form`, `browser_select_option`, `browser_press_key`, `browser_wait_for`,
`browser_network_requests`, `browser_take_screenshot`. Do **not** use `browser_evaluate` or
`browser_run_code_unsafe`. The goal is to see the app as a user and an accessibility tree do.

1. Create your own customer through the UI: open `register.htm` and register a fresh username.
   Never log in as `john/demo`.
2. Walk each scenario. After every state change, take a `browser_snapshot` and note:
   - for each element you will touch: its role and accessible name if it has one; otherwise the
     most stable attribute (`id`, `name`)
   - exact texts of headings, confirmations and error messages (copy them, don't paraphrase)
   - content that loads asynchronously (AJAX lists, confirmation panels), which needs a web-first
     wait
   - network calls the page makes (`browser_network_requests`): they tell you which API service
     can verify the outcome
3. Trigger the negative scenarios for real (empty fields, invalid values) and record what the app
   actually does. If it contradicts the story (e.g. accepts an invalid amount), that is a finding.
   Record it; do not write a test that pretends otherwise.

### 3. Map the findings onto the framework

- **Page object:** reuse an existing one, or create `src/ui/pages/<feature>.page.ts` extending
  `BasePage` (set `path`, expose locators as `readonly` fields, add user-level actions).
  - Locator ladder: `getByRole` → `getByLabel` → `getByText` / `getByTestId` → `#id` /
    `[name=…]`. Anything below `getByRole`/`getByLabel` needs a one-line comment saying why.
  - For AJAX-populated `<select>`s, use `selectOption` (it waits for the option). Where the page
    fills something in after a request, wait for readiness with a web-first assertion
    (see `OpenAccountPage.openAccount`).
  - No business assertions inside page objects.
- **Fixture:** register the new page object in `src/fixtures/index.ts`, following the existing
  pattern.
- **API verification:** if a service method is missing for the endpoint that proves the outcome,
  add it (see [generate-api-tests.md](generate-api-tests.md) for the model/service pattern).

### 4. Write the spec

Create `tests/ui/<feature>.spec.ts`:

- `import { test, expect } from '@fixtures'`, one top-level `test.describe` per feature.
- Title `should <outcome> when <condition>`; tag `@smoke` (critical path) or `@regression`.
- Use `signedInCustomer` unless the test is about logging in. Arrange preconditions (extra
  accounts, balances) through `api`, not the UI.
- Structure: arrange → act (page object) → assert UI → **assert backend state through `api`**.
- Money: capture balances before, compare deltas in cents (`toCents`), format UI expectations with
  `formatUsd`.
- Exact texts come from the exploration notes.

### 5. Run and iterate

```bash
npm run check
npx playwright test tests/ui/<feature>.spec.ts --project=chromium --repeat-each=3
npx playwright test tests/ui/<feature>.spec.ts
```

- If a test fails because **your test** is wrong, fix the test and say what you changed.
- If it fails because **the app** misbehaves, stop. Report it as a suspected defect with evidence.
  Do not loosen the assertion. A human decides whether it becomes a `test.fail()` known defect.

## Output

Reply with:

1. **Scenario table** (step 1) with the test title that covers each row.
2. **Files** created or changed.
3. **Exploration notes:** each element used → locator chosen → why (one line each).
4. **Run results:** the commands and pass/fail counts.
5. **Open questions and suspected defects.**

## Output checklist

- [ ] Every scenario has an observable outcome, and the test asserts it
- [ ] State-changing flows are verified through `api`, not only through UI text
- [ ] Only the local instance was used; the test customer was created fresh
- [ ] No `waitForTimeout`, `waitForSelector`, `networkidle`, `force: true`, `if` in tests
- [ ] Locators follow the ladder; every CSS locator has a "why" comment
- [ ] Locators live in page objects; specs contain no raw selectors
- [ ] New page object extends `BasePage` and is exposed through a fixture
- [ ] Titles start with `should`, every test has a tag
- [ ] `npm run check` passes; tests pass 3/3 with `--repeat-each=3` on chromium
- [ ] App behaviour that contradicts the story is reported, not hidden
