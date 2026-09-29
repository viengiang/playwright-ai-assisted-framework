---
id: generate-api-tests
version: 1.0.0
updated: 2026-09-29
---

# Generate API tests from the OpenAPI spec

Turns one or more operations in [specs/parabank-openapi.yaml](../specs/parabank-openapi.yaml) into
API tests built on this repo's **model / builder / service** layers. The spec is a starting point,
not the truth: ParaBank deviates from it (see [specs/SPEC-DRIFT.md](../specs/SPEC-DRIFT.md)), so
every assumption is checked against the running API first.

The output is a **draft for human review** ([review-ai-tests.md](review-ai-tests.md)).

## Inputs

| Input      | Required | Example                                      |
| ---------- | -------- | -------------------------------------------- |
| Operations | yes      | `POST /billpay`, or a tag such as `Accounts` |
| Focus      | no       | "negative cases only", "schema only"         |

## Before you start

1. Read [CLAUDE.md](../CLAUDE.md), [docs/KNOWN-ISSUES.md](../docs/KNOWN-ISSUES.md) and
   [specs/SPEC-DRIFT.md](../specs/SPEC-DRIFT.md).
2. Look at the existing layers: `src/api/models/`, `src/api/builders/`, `src/api/services/`,
   `tests/api/`. Reuse before creating.
3. `npm run env:up`. Probe **only** the local instance
   (`http://localhost:8090/parabank/services/bank/`). Never call admin endpoints (`/cleanDB`,
   `/initializeDB`, `/setParameter`) anywhere else.

## Steps

### 1. Read the operation

For each operation, write down from the spec: method, path, parameters (path/query/body, types,
required), documented responses and schemas.

### 2. Probe the real behaviour

Use your own data. Register a customer (see `RegistrationService`) or reuse a customer created in
this session, then call the endpoint with `curl -H 'Accept: application/json'`:

- one valid call: record status, `Content-Type` and body shape
- invalid calls: unknown ids, missing parameters, invalid values. Record status and exact message.
- follow-up reads that prove the effect of a write (e.g. `GET /accounts/{id}` after a transfer)

Compare with the spec. Every difference goes into `specs/SPEC-DRIFT.md` (one table row) before you
write code.

### 3. Model

In `src/api/models/<resource>.model.ts`:

- a zod schema per response body: `z.strictObject`, all properties the API always returns
  required, ids `z.number().int().positive()`, enums as `z.enum`
- `export type X = z.infer<typeof XSchema>`
- a plain TypeScript interface for the request (`XRequest`)
- a comment pointing to the spec component, plus a SPEC-DRIFT reference for each deviation

### 4. Builder

In `src/api/builders/<request>.builder.ts`: a fluent builder that produces valid defaults, has one
method per field that tests vary, and throws from `build()` when a required field is missing. See
`TransferRequestBuilder`.

### 5. Service

Add methods to the resource's service in `src/api/services/` (create the class if needed and
expose it through the `api` fixture):

- `xResponse(...)`: returns the raw `APIResponse` (for negative tests)
- `x(...)`: calls `xResponse`, then `this.client.parse(response, XSchema)` (checks 2xx and the
  schema), and returns typed data. For plain-text endpoints, return the text and throw on a
  non-2xx status (see `TransferService`).
- ParaBank is not safe for concurrent use: do not add parallelism inside services.

### 6. Tests

In `tests/api/<resource>.spec.ts`, per operation:

| Kind     | What it proves                                                               |
| -------- | ---------------------------------------------------------------------------- |
| Happy    | Status + schema (through the service) + the **effect**, read back with a GET |
| Negative | Status + exact error message for each invalid input you probed               |
| Edge     | Boundaries that matter for money or data (zero, negative, above balance, …)  |

- Data comes from the `customer` fixture and API arrangement. Never use seeded ids other than
  impossible ones (`0`).
- Money: compare deltas in cents (`toCents`).
- If the API accepts something it clearly should reject, don't assert the wrong behaviour as
  correct. Write the test for the correct behaviour, mark it `test.fail()` with the
  `@known-defect` tag and an annotation, and add an entry to `docs/KNOWN-ISSUES.md`. This needs
  human sign-off in review.

### 7. Run

```bash
npm run check
npx playwright test tests/api/<resource>.spec.ts --repeat-each=5
```

## Output

1. **Operation table:** operation → tests (titles) → covered kinds (happy/negative/edge).
2. **Spec drift** found (rows added to SPEC-DRIFT.md).
3. **Files** created or changed.
4. **Run results.**
5. **Suspected defects and open questions.**

## Output checklist

- [ ] Real behaviour was probed before writing models; drift recorded in SPEC-DRIFT.md
- [ ] Schemas are strict; properties the API always returns are required
- [ ] Service has both `x` (parsed) and `xResponse` (raw) where negatives exist
- [ ] Writes are verified by reading the resource back
- [ ] Negative tests assert status **and** exact message
- [ ] No test asserts known-wrong behaviour as correct
- [ ] Each test creates its own data; no seeded ids
- [ ] `npm run check` passes; tests pass 5/5 with `--repeat-each=5`
