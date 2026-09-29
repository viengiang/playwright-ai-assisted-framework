import type { APIResponse } from '@playwright/test';
import type { ApiClient } from '@api/client/api-client';
import { AccountListSchema, type Account } from '@api/models/account.model';
import { CustomerSchema, type Customer } from '@api/models/customer.model';

/** Customer-centric endpoints. `*Response` methods return the raw response for negative tests. */
export class CustomerService {
  constructor(private readonly client: ApiClient) {}

  loginResponse(username: string, password: string): Promise<APIResponse> {
    return this.client.get(`login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`);
  }

  async login(username: string, password: string): Promise<Customer> {
    return this.client.parse(await this.loginResponse(username, password), CustomerSchema);
  }

  getCustomerResponse(customerId: number): Promise<APIResponse> {
    return this.client.get(`customers/${String(customerId)}`);
  }

  async getCustomer(customerId: number): Promise<Customer> {
    return this.client.parse(await this.getCustomerResponse(customerId), CustomerSchema);
  }

  async getAccounts(customerId: number): Promise<Account[]> {
    const response = await this.client.get(`customers/${String(customerId)}/accounts`);
    return this.client.parse(response, AccountListSchema);
  }
}
