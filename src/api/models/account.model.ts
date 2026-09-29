import { z } from 'zod';

/** Mirrors `components.schemas.Account` in specs/parabank-openapi.yaml. */
export const AccountTypeSchema = z.enum(['CHECKING', 'SAVINGS', 'LOAN']);

export const AccountSchema = z.strictObject({
  id: z.number().int().positive(),
  customerId: z.number().int().positive(),
  type: AccountTypeSchema,
  balance: z.number(),
});

export const AccountListSchema = z.array(AccountSchema);

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type Account = z.infer<typeof AccountSchema>;

/** `POST /createAccount` query parameters. `newAccountType` is the enum's ordinal on the wire. */
export interface CreateAccountRequest {
  customerId: number;
  newAccountType: AccountType;
  fromAccountId: number;
}
