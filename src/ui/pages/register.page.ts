import type { Locator, Page } from '@playwright/test';
import type { NewCustomer } from '@data/builders/customer.builder';
import { BasePage } from './base.page';

export type RegistrationField =
  | 'firstName'
  | 'lastName'
  | 'street'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'phoneNumber'
  | 'ssn'
  | 'username'
  | 'password'
  | 'repeatedPassword';

const FIELD_IDS: Record<RegistrationField, string> = {
  firstName: 'customer.firstName',
  lastName: 'customer.lastName',
  street: 'customer.address.street',
  city: 'customer.address.city',
  state: 'customer.address.state',
  zipCode: 'customer.address.zipCode',
  phoneNumber: 'customer.phoneNumber',
  ssn: 'customer.ssn',
  username: 'customer.username',
  password: 'customer.password',
  repeatedPassword: 'repeatedPassword',
};

export class RegisterPage extends BasePage {
  protected readonly path = 'register.htm';

  readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.registerButton = this.content.getByRole('button', { name: 'Register' });
  }

  /**
   * Labels sit in a separate table cell with no `for` attribute, so inputs have no accessible
   * name. Their ids are stable and mirror the server-side form model.
   */
  input(field: RegistrationField): Locator {
    return this.page.locator(`[id="${FIELD_IDS[field]}"]`);
  }

  /** Server-side validation message rendered next to a field. */
  fieldError(field: RegistrationField): Locator {
    return this.page.locator(`[id="${FIELD_IDS[field]}.errors"]`);
  }

  welcomeHeading(username: string): Locator {
    return this.content.getByRole('heading', { name: `Welcome ${username}`, exact: true });
  }

  async fillForm(customer: NewCustomer, confirmPassword = customer.password): Promise<void> {
    await this.input('firstName').fill(customer.firstName);
    await this.input('lastName').fill(customer.lastName);
    await this.input('street').fill(customer.address.street);
    await this.input('city').fill(customer.address.city);
    await this.input('state').fill(customer.address.state);
    await this.input('zipCode').fill(customer.address.zipCode);
    await this.input('phoneNumber').fill(customer.phoneNumber);
    await this.input('ssn').fill(customer.ssn);
    await this.input('username').fill(customer.username);
    await this.input('password').fill(customer.password);
    await this.input('repeatedPassword').fill(confirmPassword);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  async register(customer: NewCustomer): Promise<void> {
    await this.fillForm(customer);
    await this.submit();
  }
}
