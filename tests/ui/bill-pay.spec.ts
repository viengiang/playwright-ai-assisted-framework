import { test, expect } from '@fixtures';
import { CreateAccountRequestBuilder } from '@api/builders/create-account-request.builder';
import type { Transaction } from '@api/models/transaction.model';
import { PayeeBuilder } from '@data/builders/payee.builder';
import type { BillPayField } from '@pages/bill-pay.page';
import { formatUsd, toCents } from '@utils/money';

/** Transactions in a shape that compares money in cents. */
const ledger = (transactions: Transaction[]) =>
  transactions.map(({ type, description, amount }) => ({
    type,
    description,
    cents: toCents(amount),
  }));

test.describe('Bill pay', () => {
  test(
    'should debit only the chosen account and confirm the payment when the payee details are valid',
    { tag: '@smoke' },
    async ({ signedInCustomer: customer, api, billPayPage }) => {
      // Pay from a second account, not the pre-selected one, so the test proves the choice is honoured.
      const savings = await api.accounts.createAccount(
        new CreateAccountRequestBuilder()
          .forCustomer(customer.id)
          .ofType('SAVINGS')
          .fundedFrom(customer.primaryAccountId)
          .build(),
      );
      const fromBefore = await api.accounts.getAccount(savings.id);
      const otherBefore = await api.accounts.getAccount(customer.primaryAccountId);
      const payee = new PayeeBuilder().build();
      const amount = 37.45;
      await billPayPage.goto();

      await billPayPage.pay({ payee, amount, fromAccountId: savings.id });

      await expect(billPayPage.successHeading).toBeVisible();
      await expect(billPayPage.confirmation).toContainText(
        `Bill Payment to ${payee.name} in the amount of ${formatUsd(toCents(amount))} from account ${String(savings.id)} was successful.`,
      );
      // Verify the ledger, not just the confirmation banner.
      const fromAfter = await api.accounts.getAccount(savings.id);
      const otherAfter = await api.accounts.getAccount(customer.primaryAccountId);
      expect(toCents(fromBefore.balance) - toCents(fromAfter.balance)).toBe(toCents(amount));
      expect(toCents(otherAfter.balance)).toBe(toCents(otherBefore.balance));
      expect(ledger(await api.accounts.getTransactions(savings.id))).toContainEqual({
        type: 'Debit',
        description: `Bill Payment to ${payee.name}`,
        cents: toCents(amount),
      });
    },
  );

  test(
    'should flag every required field and make no payment when the form is submitted empty',
    { tag: '@regression' },
    async ({ signedInCustomer: customer, api, billPayPage }) => {
      const expectedErrors: [BillPayField, string][] = [
        ['Payee Name:', 'Payee name is required.'],
        ['Address:', 'Address is required.'],
        ['City:', 'City is required.'],
        ['State:', 'State is required.'],
        ['Zip Code:', 'Zip Code is required.'],
        ['Phone #:', 'Phone number is required.'],
        ['Account #:', 'Account number is required.'],
        ['Verify Account #:', 'Account number is required.'],
        ['Amount: $', 'The amount cannot be empty.'],
      ];
      const before = await api.accounts.getAccount(customer.primaryAccountId);
      const transactionsBefore = await api.accounts.getTransactions(customer.primaryAccountId);
      await billPayPage.goto();

      await billPayPage.sendPaymentButton.click();

      for (const [field, message] of expectedErrors) {
        await expect(billPayPage.fieldRow(field)).toContainText(message);
      }
      await expect(billPayPage.successHeading).toBeHidden();
      const after = await api.accounts.getAccount(customer.primaryAccountId);
      expect(toCents(after.balance)).toBe(toCents(before.balance));
      expect(await api.accounts.getTransactions(customer.primaryAccountId)).toEqual(
        transactionsBefore,
      );
    },
  );

  test(
    'should refuse the payment when the verify account number does not match',
    { tag: '@regression' },
    async ({ signedInCustomer: customer, api, billPayPage }) => {
      const payee = new PayeeBuilder().withAccountNumber('12345678').build();
      const before = await api.accounts.getAccount(customer.primaryAccountId);
      const transactionsBefore = await api.accounts.getTransactions(customer.primaryAccountId);
      await billPayPage.goto();

      await billPayPage.pay({
        payee,
        amount: 20,
        fromAccountId: customer.primaryAccountId,
        verifyAccountNumber: '87654321',
      });

      await expect(billPayPage.fieldRow('Verify Account #:')).toContainText(
        'The account numbers do not match.',
      );
      await expect(billPayPage.successHeading).toBeHidden();
      const after = await api.accounts.getAccount(customer.primaryAccountId);
      expect(toCents(after.balance)).toBe(toCents(before.balance));
      expect(await api.accounts.getTransactions(customer.primaryAccountId)).toEqual(
        transactionsBefore,
      );
    },
  );
});
