---
id: review-ai-tests
version: 1.0.0
updated: 2026-09-29
---

# Review checklist for AI-generated tests

AI-generated tests tend to fail in predictable ways. They pass while proving little, they rely on
the wrong waits, and they quietly assume shared data. This checklist targets those failure modes.
A human runs it (optionally with an agent's help) before an AI draft is merged.

## Inputs

- The draft: the diff or file list
- The generator's output report (scenario table, exploration notes, run results)

## Procedure

1. **Run the machine checks first.** Anything they catch doesn't need human attention.
   ```bash
   npm run check
   npx playwright test <new specs> --project=chromium --repeat-each=5
   npx playwright test <new specs>
   ```
2. **Read every new or changed line** against the checklist below. Record findings in the output
   table.
3. **Sensitivity check (negative control).** For each key assertion, temporarily break the
   expectation (e.g. expected amount + 0.01, a wrong account id, a different message) and confirm
   the test fails with a readable error. Revert afterwards. If a test still passes when its
   expectation is wrong, it doesn't test anything.
4. **Fix or send back.** Blockers and majors must be fixed before merge. Record what the AI got
   wrong. The pattern feeds back into the generator instructions (bump its version).

## Checklist

Severity: **B** = blocker (must fix), **M** = major (fix before merge), **m** = minor (fix or
justify).

### 1. Assertions verify behaviour

- [ ] **B** Every test asserts an outcome from the story: a state change, a specific message, or
      data. Assertions only on "page visible" or "heading visible" don't count.
- [ ] **B** State-changing UI flows are confirmed through the API (`api` fixture), not only by UI
      text.
- [ ] **B** No tautologies: nothing asserts values the test just arranged or read back unchanged.
- [ ] **M** Expected values are specific (exact text, exact cents), not `toBeTruthy()` or
      `toContain('')`, and not regexes loose enough to match errors.
- [ ] **M** Money uses deltas in cents (`toCents`), not absolute defaults or floating-point math.
- [ ] **M** Negative paths assert that nothing changed (no record created, balance untouched), not
      only that an error appeared.
- [ ] **M** Passed the sensitivity check (procedure step 3).

### 2. Locators

- [ ] **M** Ladder respected: `getByRole` → `getByLabel` → `getByText`/`getByTestId` → CSS.
- [ ] **M** Every CSS locator has a comment explaining why nothing better exists, and the reason is
      true (check the snapshot).
- [ ] **M** No XPath, no `nth()`/`first()` used to paper over an ambiguous locator, no styling
      classes, no text copied from dynamic data.
- [ ] **M** Locators live in page objects; specs contain no raw selectors.

### 3. Waiting and synchronisation

- [ ] **B** No `waitForTimeout`, `setTimeout`, `waitForSelector`, `networkidle` (ESLint catches
      most of these).
- [ ] **M** Async content (AJAX lists, result panels) is awaited with web-first assertions or
      auto-waiting actions (`selectOption`), not by sleeping or by reading `textContent()` early.
- [ ] **M** Values read from the page (`textContent`, `inputValue`) are read only after a readiness
      assertion.

### 4. Data isolation

- [ ] **B** Each test creates its own customer (`customer` / `signedInCustomer`). No `john/demo`,
      no seeded ids, no data left behind for another test.
- [ ] **B** No admin endpoints against the public instance.
- [ ] **M** No dependency on test order or on another test's side effects.
- [ ] **M** Random data can't trip validation (length limits, allowed characters).

### 5. Flakiness risks

- [ ] **M** Stable across `--repeat-each=5` on chromium and one run on every browser.
- [ ] **M** No reliance on time of day, dates, locale formatting or animation timing.
- [ ] **M** Does not raise `workers` or add parallelism (ParaBank is not concurrency-safe).
- [ ] **m** Timeouts not raised to hide slowness.

### 6. Conventions and value

- [ ] **M** Imports from `@fixtures`, one top-level `describe`, `should …` title, a tag.
- [ ] **M** Not a duplicate of existing coverage (search `tests/`), and each test adds a scenario
      from the story.
- [ ] **M** App behaviour that contradicts the story is handled with the known-defect process, not
      by asserting the wrong behaviour as correct or by skipping.
- [ ] **m** New page objects extend `BasePage`, expose `readonly` locators, contain no business
      assertions, and are wired into fixtures.
- [ ] **m** No dead code, commented-out code, unused imports or unexplained magic numbers.

## Output

```md
## Review: <draft>

Machine checks: check ✓/✗ · repeat-each=5 x/5 · all browsers x/y
Sensitivity check: <assertion> → failed as expected ✓ / still passed ✗

| #   | Sev | Location | Finding | Fix |
| --- | --- | -------- | ------- | --- |

Verdict: approve | approve after fixes | send back
Feedback for the generator: <patterns worth encoding in ai/generate-*.md>
```
