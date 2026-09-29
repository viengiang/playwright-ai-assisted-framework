import { test, expect } from '@fixtures';
import { CustomerBuilder } from '@data/builders/customer.builder';
import type { RegistrationField } from '@pages/register.page';

const REQUIRED_FIELD_ERRORS: [RegistrationField, string][] = [
  ['firstName', 'First name is required.'],
  ['lastName', 'Last name is required.'],
  ['street', 'Address is required.'],
  ['city', 'City is required.'],
  ['state', 'State is required.'],
  ['zipCode', 'Zip Code is required.'],
  ['ssn', 'Social Security Number is required.'],
  ['username', 'Username is required.'],
  ['password', 'Password is required.'],
  ['repeatedPassword', 'Password confirmation is required.'],
];

test.describe('Registration', () => {
  test(
    'should create the customer and log them in when the form is valid',
    { tag: '@smoke' },
    async ({ registerPage, api }) => {
      const newCustomer = new CustomerBuilder().build();
      await registerPage.goto();

      await registerPage.register(newCustomer);

      await expect(registerPage.welcomeHeading(newCustomer.username)).toBeVisible();
      await expect(registerPage.menu.link('Log Out')).toBeVisible();
      // The profile must be persisted exactly as entered, not just acknowledged by the UI.
      const stored = await api.customers.login(newCustomer.username, newCustomer.password);
      expect(stored).toMatchObject({
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        address: newCustomer.address,
        phoneNumber: newCustomer.phoneNumber,
        ssn: newCustomer.ssn,
      });
    },
  );

  test(
    'should flag every required field when the form is submitted empty',
    { tag: '@regression' },
    async ({ registerPage }) => {
      await registerPage.goto();

      await registerPage.submit();

      for (const [field, message] of REQUIRED_FIELD_ERRORS) {
        await expect.soft(registerPage.fieldError(field), field).toHaveText(message);
      }
      // Phone number is the only optional field.
      await expect(registerPage.fieldError('phoneNumber')).toBeHidden();
      await expect(registerPage.menu.link('Log Out')).toBeHidden();
    },
  );

  test(
    'should not create the customer when the password confirmation does not match',
    { tag: '@regression' },
    async ({ registerPage, api }) => {
      const newCustomer = new CustomerBuilder().build();
      await registerPage.goto();

      await registerPage.fillForm(newCustomer, `${newCustomer.password}x`);
      await registerPage.submit();

      await expect(registerPage.fieldError('repeatedPassword')).toHaveText(
        'Passwords did not match.',
      );
      const login = await api.customers.loginResponse(newCustomer.username, newCustomer.password);
      expect(login.status()).toBe(400);
    },
  );
});
