import { test, expect } from '@fixtures';
import { CreateAccountRequestBuilder } from '@api/builders/create-account-request.builder';
import { TransferRequestBuilder } from '@api/builders/transfer-request.builder';
import { toCents } from '@utils/money';

test.describe('Transfers API', () => {
  test(
    'should move funds between own accounts and record a debit and a credit',
    { tag: '@smoke' },
    async ({ api, customer }) => {
      const savings = await api.accounts.createAccount(
        new CreateAccountRequestBuilder()
          .forCustomer(customer.id)
          .ofType('SAVINGS')
          .fundedFrom(customer.primaryAccountId)
          .build(),
      );
      const fromBefore = await api.accounts.getAccount(customer.primaryAccountId);
      const toBefore = await api.accounts.getAccount(savings.id);
      const amount = 25.5;

      const message = await api.transfers.transfer(
        new TransferRequestBuilder().from(fromBefore.id).to(savings.id).amount(amount).build(),
      );

      expect(message).toBe(
        `Successfully transferred $${String(amount)} from account #${String(fromBefore.id)} to account #${String(savings.id)}`,
      );
      const fromAfter = await api.accounts.getAccount(fromBefore.id);
      const toAfter = await api.accounts.getAccount(savings.id);
      expect(toCents(fromBefore.balance) - toCents(fromAfter.balance)).toBe(toCents(amount));
      expect(toCents(toAfter.balance) - toCents(toBefore.balance)).toBe(toCents(amount));

      // Transaction lists are schema-validated by the service.
      expect(await api.accounts.getTransactions(fromBefore.id)).toContainEqual(
        expect.objectContaining({ type: 'Debit', amount, description: 'Funds Transfer Sent' }),
      );
      expect(await api.accounts.getTransactions(savings.id)).toContainEqual(
        expect.objectContaining({ type: 'Credit', amount, description: 'Funds Transfer Received' }),
      );
    },
  );

  test(
    'should reject with 400 when the source account does not exist',
    { tag: '@regression' },
    async ({ api, customer }) => {
      const response = await api.transfers.transferResponse(
        new TransferRequestBuilder().from(0).to(customer.primaryAccountId).amount(10).build(),
      );

      expect(response.status()).toBe(400);
      expect(await response.text()).toBe(
        `Could not find account number 0 and/or ${String(customer.primaryAccountId)}`,
      );
    },
  );

  test(
    'should reject a negative transfer amount',
    {
      tag: ['@regression', '@known-defect'],
      annotation: {
        type: 'known defect',
        description: 'ParaBank accepts negative amounts (HTTP 200). See docs/KNOWN-ISSUES.md.',
      },
    },
    async ({ api, customer }) => {
      // Expected to fail until ParaBank validates amounts. If it ever passes, Playwright reports
      // it as an unexpected pass, prompting removal of this marker.
      test.fail();
      const savings = await api.accounts.createAccount(
        new CreateAccountRequestBuilder()
          .forCustomer(customer.id)
          .fundedFrom(customer.primaryAccountId)
          .build(),
      );

      const response = await api.transfers.transferResponse(
        new TransferRequestBuilder()
          .from(customer.primaryAccountId)
          .to(savings.id)
          .amount(-5)
          .build(),
      );

      expect(response.status()).toBe(400);
    },
  );
});
