import type { TransferRequest } from '@api/models/transaction.model';

/**
 * Builds `POST /transfer` payloads.
 *
 * @example new TransferRequestBuilder().from(checking.id).to(savings.id).amount(25).build()
 */
export class TransferRequestBuilder {
  private fromAccountId?: number;
  private toAccountId?: number;
  private transferAmount = 10;

  from(accountId: number): this {
    this.fromAccountId = accountId;
    return this;
  }

  to(accountId: number): this {
    this.toAccountId = accountId;
    return this;
  }

  amount(value: number): this {
    this.transferAmount = value;
    return this;
  }

  build(): TransferRequest {
    if (this.fromAccountId === undefined || this.toAccountId === undefined) {
      throw new Error('TransferRequestBuilder: from() and to() are required');
    }
    return {
      fromAccountId: this.fromAccountId,
      toAccountId: this.toAccountId,
      amount: this.transferAmount,
    };
  }
}
