import { z } from 'zod';

/**
 * Mirrors `components.schemas.Transaction` in specs/parabank-openapi.yaml, with one
 * documented deviation: the spec declares `date` as a `date-time` string, but the API returns
 * epoch milliseconds. See specs/SPEC-DRIFT.md.
 */
export const TransactionSchema = z.strictObject({
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  type: z.enum(['Credit', 'Debit']),
  date: z.number().int().nonnegative(),
  amount: z.number(),
  description: z.string(),
});

export const TransactionListSchema = z.array(TransactionSchema);

export type Transaction = z.infer<typeof TransactionSchema>;

/** `POST /transfer` query parameters. */
export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}
