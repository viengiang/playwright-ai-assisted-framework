# OpenAPI spec vs. observed behaviour

`parabank-openapi.yaml` is vendored from `/parabank/services/bank/openapi.yaml` (OpenAPI 3.0.1,
API version 3.0.0). The public and Docker instances served identical copies on 2026-09-29.

The zod models in `src/api/models/` follow **observed** behaviour. Each place where that differs
from the spec is listed here and referenced from the code.

| # | Where | Spec says | API does | How the framework handles it |
|---|---|---|---|---|
| 1 | `Transaction.date` | `string`, `format: date-time` | Integer epoch milliseconds, e.g. `1790640000000` | `TransactionSchema.date` is `z.number().int()` |
| 2 | `Customer`, `Account`, `Transaction` | No `required` properties | Every property is always present | Schemas require all properties and are strict (no unknown keys) |
| 3 | `POST /createAccount` response | Returns the new `Account` | Returned `balance` is `0`. A `GET /accounts/{id}` right after shows the real opening deposit (100.00 on a default Docker instance) | Tests re-read the account before asserting balances |
| 4 | `POST /transfer` success | `application/json` body of `type: string` | `Content-Type: application/json`, but the body is an unquoted sentence (`Successfully transferred $10 from …`), so it is not valid JSON | `TransferService` reads the body as text |
| 5 | Error responses | Only a `default` response is documented, with no error schema | `400` with a `text/plain` message, e.g. `Could not find account #0` | Negative tests assert status and exact message text |

Keep this file in sync with any model change that deviates from the spec.
