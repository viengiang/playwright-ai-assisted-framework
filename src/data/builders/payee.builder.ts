import { faker } from '@faker-js/faker';
import type { Address } from '@api/models/customer.model';

/** Everything the Bill Pay form asks about the payee. */
export interface NewPayee {
  name: string;
  address: Address;
  phoneNumber: string;
  accountNumber: string;
}

/**
 * Produces a valid, unique payee for every test.
 *
 * @example new PayeeBuilder().withName('Acme Power').build()
 */
export class PayeeBuilder {
  private readonly payee: NewPayee;

  constructor() {
    this.payee = {
      name: faker.company.name(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####'),
      },
      phoneNumber: faker.string.numeric(10),
      accountNumber: faker.string.numeric(8),
    };
  }

  withName(name: string): this {
    this.payee.name = name;
    return this;
  }

  withAccountNumber(accountNumber: string): this {
    this.payee.accountNumber = accountNumber;
    return this;
  }

  build(): NewPayee {
    return structuredClone(this.payee);
  }
}
