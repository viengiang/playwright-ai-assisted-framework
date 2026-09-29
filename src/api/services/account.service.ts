import type { APIResponse } from '@playwright/test';
import type { ApiClient } from '@api/client/api-client';
import {
  AccountSchema,
  AccountTypeSchema,
  type Account,
  type CreateAccountRequest,
} from '@api/models/account.model';
import { TransactionListSchema, type Transaction } from '@api/models/transaction.model';

/** Account-centric endpoints. `*Response` methods return the raw response for negative tests. */
export class AccountService {
  constructor(private readonly client: ApiClient) {}

  getAccountResponse(accountId: number): Promise<APIResponse> {
    return this.client.get(`accounts/${String(accountId)}`);
  }

  async getAccount(accountId: number): Promise<Account> {
    return this.client.parse(await this.getAccountResponse(accountId), AccountSchema);
  }

  /**
   * Note: the returned `balance` is always 0 — the initial deposit is applied after the
   * response is built. Re-read the account for its real balance (see specs/SPEC-DRIFT.md).
   */
  async createAccount(request: CreateAccountRequest): Promise<Account> {
    const response = await this.client.post('createAccount', {
      customerId: request.customerId,
      newAccountType: AccountTypeSchema.options.indexOf(request.newAccountType),
      fromAccountId: request.fromAccountId,
    });
    return this.client.parse(response, AccountSchema);
  }

  async getTransactions(accountId: number): Promise<Transaction[]> {
    const response = await this.client.get(`accounts/${String(accountId)}/transactions`);
    return this.client.parse(response, TransactionListSchema);
  }
}
