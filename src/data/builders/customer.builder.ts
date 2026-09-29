import { faker } from '@faker-js/faker';
import type { Address } from '@api/models/customer.model';

/** Everything the ParaBank sign-up form asks for. */
export interface NewCustomer {
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}

/**
 * Produces a valid, unique customer for every test, so tests never share data.
 * Usernames/passwords are alphanumeric because the login endpoint takes them as path segments.
 *
 * @example new CustomerBuilder().withFirstName('Ada').build()
 */
export class CustomerBuilder {
  private readonly customer: NewCustomer;

  constructor() {
    this.customer = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####'),
      },
      phoneNumber: faker.string.numeric(10),
      ssn: faker.string.numeric(9),
      username: `qa${faker.string.alphanumeric({ length: 12, casing: 'lower' })}`,
      password: faker.string.alphanumeric(14),
    };
  }

  withFirstName(firstName: string): this {
    this.customer.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.customer.lastName = lastName;
    return this;
  }

  withUsername(username: string): this {
    this.customer.username = username;
    return this;
  }

  withPassword(password: string): this {
    this.customer.password = password;
    return this;
  }

  build(): NewCustomer {
    return structuredClone(this.customer);
  }
}
