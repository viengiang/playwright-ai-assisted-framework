import { test, expect } from '@fixtures';
import { formatUsd, toCents } from '@utils/money';

test.describe('Open new account', () => {
  test(
    'should open a savings account and list it in the accounts overview',
    { tag: '@regression' },
    async ({ signedInCustomer: customer, api, openAccountPage, accountsOverviewPage }) => {
      await openAccountPage.goto();

      const newAccountId = await openAccountPage.openAccount('SAVINGS', customer.primaryAccountId);

      await expect(openAccountPage.successHeading).toBeVisible();
      const account = await api.accounts.getAccount(newAccountId);
      expect(account).toMatchObject({ customerId: customer.id, type: 'SAVINGS' });

      await openAccountPage.menu.open('Accounts Overview');
      await expect(accountsOverviewPage.accountRow(newAccountId)).toContainText(
        formatUsd(toCents(account.balance)),
      );
    },
  );
});
