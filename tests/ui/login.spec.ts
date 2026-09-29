import { test, expect } from '@fixtures';

test.describe('Login', () => {
  test(
    'should open the accounts overview when the credentials are valid',
    { tag: '@smoke' },
    async ({ customer, loginPage, accountsOverviewPage }) => {
      await loginPage.goto();

      await loginPage.login(customer.username, customer.password);

      await expect(accountsOverviewPage.heading).toBeVisible();
      await expect(accountsOverviewPage.menu.welcomeMessage).toHaveText(
        `Welcome ${customer.firstName} ${customer.lastName}`,
      );
      await expect(accountsOverviewPage.accountRow(customer.primaryAccountId)).toBeVisible();
    },
  );

  test(
    'should show an error and stay logged out when the password is wrong',
    { tag: '@regression' },
    async ({ customer, loginPage }) => {
      await loginPage.goto();

      await loginPage.login(customer.username, 'not-the-password');

      await expect(loginPage.errorHeading).toBeVisible();
      await expect(loginPage.errorMessage).toHaveText(
        'The username and password could not be verified.',
      );
      await expect(loginPage.menu.link('Log Out')).toBeHidden();
    },
  );
});
