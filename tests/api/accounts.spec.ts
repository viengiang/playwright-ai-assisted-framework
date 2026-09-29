import { test, expect } from '@fixtures';
import { CreateAccountRequestBuilder } from '@api/builders/create-account-request.builder';
import { toCents } from '@utils/money';

test.describe('Accounts API', () => {
  test(
    'should give a new customer exactly one checking account',
    { tag: '@smoke' },
    async ({ api, customer }) => {
      const accounts = await api.customers.getAccounts(customer.id);

      expect(accounts).toEqual([
        expect.objectContaining({
          id: customer.primaryAccountId,
          customerId: customer.id,
          type: 'CHECKING',
        }),
      ]);
    },
  );

  test(
    'should open a savings account funded by moving money from an existing account',
    { tag: '@regression' },
    async ({ api, customer }) => {
      const fundingBefore = await api.accounts.getAccount(customer.primaryAccountId);

      const created = await api.accounts.createAccount(
        new CreateAccountRequestBuilder()
          .forCustomer(customer.id)
          .ofType('SAVINGS')
          .fundedFrom(customer.primaryAccountId)
          .build(),
      );

      expect(created).toMatchObject({ customerId: customer.id, type: 'SAVINGS' });
      // The create response reports balance 0; the real opening balance must be re-read.
      const opened = await api.accounts.getAccount(created.id);
      const fundingAfter = await api.accounts.getAccount(customer.primaryAccountId);
      expect(toCents(opened.balance)).toBeGreaterThan(0);
      expect(toCents(fundingBefore.balance) - toCents(fundingAfter.balance)).toBe(
        toCents(opened.balance),
      );
      const accountIds = (await api.customers.getAccounts(customer.id)).map(({ id }) => id);
      expect(accountIds).toHaveLength(2);
      expect(accountIds).toEqual(expect.arrayContaining([customer.primaryAccountId, created.id]));
    },
  );

  test(
    'should respond 400 with a message when the account does not exist',
    { tag: '@regression' },
    async ({ api }) => {
      // ParaBank ids are positive, so 0 can never exist.
      const response = await api.accounts.getAccountResponse(0);

      expect(response.status()).toBe(400);
      expect(await response.text()).toBe('Could not find account #0');
    },
  );
});
