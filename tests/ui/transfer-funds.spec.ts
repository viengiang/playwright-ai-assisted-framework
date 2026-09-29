import { test, expect } from '@fixtures';
import { CreateAccountRequestBuilder } from '@api/builders/create-account-request.builder';
import { formatUsd, toCents } from '@utils/money';

test.describe('Transfer funds', () => {
  test(
    'should move money between own accounts and update both balances',
    { tag: '@smoke' },
    async ({ signedInCustomer: customer, api, transferFundsPage, accountsOverviewPage }) => {
      // Arrange through the API: fast, and keeps the UI test focused on the transfer itself.
      const savings = await api.accounts.createAccount(
        new CreateAccountRequestBuilder()
          .forCustomer(customer.id)
          .ofType('SAVINGS')
          .fundedFrom(customer.primaryAccountId)
          .build(),
      );
      const fromBefore = await api.accounts.getAccount(customer.primaryAccountId);
      const toBefore = await api.accounts.getAccount(savings.id);
      const amount = 42.25;
      await transferFundsPage.goto();

      await transferFundsPage.transfer({
        amount,
        fromAccountId: fromBefore.id,
        toAccountId: savings.id,
      });

      await expect(transferFundsPage.successHeading).toBeVisible();
      await expect(transferFundsPage.confirmation).toContainText(
        `${formatUsd(toCents(amount))} has been transferred from account #${String(fromBefore.id)} to account #${String(savings.id)}.`,
      );
      // Verify the ledger, not just the confirmation banner.
      const fromAfter = await api.accounts.getAccount(fromBefore.id);
      const toAfter = await api.accounts.getAccount(savings.id);
      expect(toCents(fromBefore.balance) - toCents(fromAfter.balance)).toBe(toCents(amount));
      expect(toCents(toAfter.balance) - toCents(toBefore.balance)).toBe(toCents(amount));

      await transferFundsPage.menu.open('Accounts Overview');
      await expect(accountsOverviewPage.accountRow(fromBefore.id)).toContainText(
        formatUsd(toCents(fromAfter.balance)),
      );
      await expect(accountsOverviewPage.accountRow(savings.id)).toContainText(
        formatUsd(toCents(toAfter.balance)),
      );
    },
  );
});
