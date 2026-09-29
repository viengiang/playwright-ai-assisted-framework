# Known issues in the system under test

Defects and constraints found in ParaBank while building this suite (verified 2026-09-29 against
`parasoft/parabank:latest` in Docker and, where noted, the public instance). They shape several
framework decisions, and each one says how the suite deals with it.

## 1. Not safe for concurrent use

**Observed**

- Overlapping sign-ups are rejected with _"This username already exists."_ even for random
  14-character usernames. With plain `curl` and 4–8 parallel sign-ups, half or more failed. It
  also happened on the public instance.
- Overlapping `POST /createAccount` calls return `400 Could not create new account…`. Under
  parallel test load, one returned an account id that later answered _"Could not find account"_.
- Ids appear to come from one shared sequence (steps of 111 across customers, accounts and
  transactions), which fits a non-atomic id allocation.
- A new session's `GET register.htm` was once served another request's success page
  (_"Welcome null — Your account was created successfully"_), so view state leaks between
  sessions.

**Handling:** `workers: 1` per ParaBank instance (`playwright.config.ts`). CI scales out with
shards, and each shard gets its own Docker instance. With this setup, 96/96 tests passed over 3
repeated runs on Docker.

## 2. Transfers accept invalid amounts

`POST /transfer` answers `200 Successfully transferred` for negative amounts (`amount=-5`) and for
amounts larger than the source balance.

**Handling:** `tests/api/transfers.spec.ts` › _should reject a negative transfer amount_ is marked
`test.fail()` and tagged `@known-defect`. It runs on every build. If ParaBank ever starts
validating amounts, Playwright reports an unexpected pass and the marker should be removed.

## 3. Empty transfer form shows an internal error

Submitting _Transfer Funds_ with no amount shows _"An internal error has occurred and has been
logged."_ The page contains hidden validation messages (_"The amount cannot be empty."_) that are
never shown.

**Handling:** not covered by a test yet. The account lists are loaded by AJAX, so the page object
selects accounts with `selectOption`, which waits for the options to exist before submitting.

## 4. Form fields have no accessible names

The login, registration, open-account and transfer forms render label text in separate elements
(`<p>`, `<td>`, loose text) with no `<label for>` or `aria-label`. `getByLabel` and
`getByRole('textbox', { name })` cannot find these fields, which also makes the forms hard to use
with assistive technology.

**Handling:** page objects use `#id` / `[name=…]` for these fields, with a comment at each one.
Buttons, links, headings and table rows still use role-based locators.

## 5. Registration needs a session

`POST register.htm` without first loading the form (no `JSESSIONID`) fails with HTTP 500.

**Handling:** `RegistrationService` does `GET` then `POST` on the same request context.

## 6. Public instance constraints

- The database is shared, and admin endpoints (`/cleanDB`, `/initializeDB`, `/setParameter`)
  need no authentication. Seed data and default balances can change at any time.
- The instance sits behind Cloudflare. After about 30 sign-ups in a short burst, `POST register.htm`
  returned a `403` bot challenge (_"Just a moment…"_).

**Handling:** tests create their own data and assert balance deltas, never absolute defaults.
Admin endpoints are never called on the public instance. The suite reports the Cloudflare
challenge with a clear message and never tries to get around it. CI runs against Docker.
