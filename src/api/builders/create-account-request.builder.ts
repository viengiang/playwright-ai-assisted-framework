import type { AccountType, CreateAccountRequest } from '@api/models/account.model';

/**
 * Builds `POST /createAccount` payloads. Defaults to a CHECKING account.
 *
 * @example new CreateAccountRequestBuilder().forCustomer(c.id).ofType('SAVINGS').fundedFrom(a.id).build()
 */
export class CreateAccountRequestBuilder {
  private customerId?: number;
  private fromAccountId?: number;
  private type: AccountType = 'CHECKING';

  forCustomer(customerId: number): this {
    this.customerId = customerId;
    return this;
  }

  ofType(type: AccountType): this {
    this.type = type;
    return this;
  }

  fundedFrom(accountId: number): this {
    this.fromAccountId = accountId;
    return this;
  }

  build(): CreateAccountRequest {
    if (this.customerId === undefined || this.fromAccountId === undefined) {
      throw new Error('CreateAccountRequestBuilder: forCustomer() and fundedFrom() are required');
    }
    return {
      customerId: this.customerId,
      newAccountType: this.type,
      fromAccountId: this.fromAccountId,
    };
  }
}
