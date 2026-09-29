import { test, expect } from '@fixtures';

test.describe('Customers API', () => {
  test(
    'should return the registered profile when a customer is fetched by id',
    { tag: '@smoke' },
    async ({ api, customer }) => {
      // getCustomer validates the body against CustomerSchema before returning it.
      const profile = await api.customers.getCustomer(customer.id);

      expect(profile).toEqual({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address,
        phoneNumber: customer.phoneNumber,
        ssn: customer.ssn,
      });
    },
  );

  test(
    'should reject login with 400 when the password is wrong',
    { tag: '@regression' },
    async ({ api, customer }) => {
      const response = await api.customers.loginResponse(customer.username, 'not-the-password');

      expect(response.status()).toBe(400);
      expect(await response.text()).toBe('Invalid username and/or password');
    },
  );
});
