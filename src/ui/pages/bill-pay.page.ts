import type { Locator, Page } from '@playwright/test';
import type { NewPayee } from '@data/builders/payee.builder';
import { BasePage } from './base.page';

export interface BillPayment {
  payee: NewPayee;
  amount: number;
  fromAccountId: number;
  /** What the customer types in "Verify Account #". Defaults to the payee's account number. */
  verifyAccountNumber?: string;
}

/** Label text of each form row, exactly as rendered in the first cell. */
export type BillPayField =
  | 'Payee Name:'
  | 'Address:'
  | 'City:'
  | 'State:'
  | 'Zip Code:'
  | 'Phone #:'
  | 'Account #:'
  | 'Verify Account #:'
  | 'Amount: $';

export class BillPayPage extends BasePage {
  protected readonly path = 'billpay.htm';

  readonly payeeNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly accountNumberInput: Locator;
  readonly verifyAccountNumberInput: Locator;
  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly sendPaymentButton: Locator;
  readonly successHeading: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    super(page);
    // Labels are plain <td> text with no <label>/aria-label, and the inputs have no id;
    // `name` is the only stable hook (KNOWN-ISSUES #4).
    this.payeeNameInput = this.content.locator('[name="payee.name"]');
    this.streetInput = this.content.locator('[name="payee.address.street"]');
    this.cityInput = this.content.locator('[name="payee.address.city"]');
    this.stateInput = this.content.locator('[name="payee.address.state"]');
    this.zipCodeInput = this.content.locator('[name="payee.address.zipCode"]');
    this.phoneNumberInput = this.content.locator('[name="payee.phoneNumber"]');
    this.accountNumberInput = this.content.locator('[name="payee.accountNumber"]');
    this.verifyAccountNumberInput = this.content.locator('[name="verifyAccount"]');
    this.amountInput = this.content.locator('[name="amount"]');
    this.fromAccountSelect = this.content.locator('[name="fromAccountId"]');
    this.sendPaymentButton = this.content.getByRole('button', { name: 'Send Payment' });
    this.successHeading = this.content.getByRole('heading', { name: 'Bill Payment Complete' });
    // The result panel is a bare <div> with no role or name; its id is the only hook.
    this.confirmation = this.content.locator('#billpayResult');
  }

  /** Form row for a field: holds the input and, after a failed submit, its validation message. */
  fieldRow(label: BillPayField): Locator {
    return this.content
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: label, exact: true }) });
  }

  async pay({ payee, amount, fromAccountId, verifyAccountNumber }: BillPayment): Promise<void> {
    await this.payeeNameInput.fill(payee.name);
    await this.streetInput.fill(payee.address.street);
    await this.cityInput.fill(payee.address.city);
    await this.stateInput.fill(payee.address.state);
    await this.zipCodeInput.fill(payee.address.zipCode);
    await this.phoneNumberInput.fill(payee.phoneNumber);
    await this.accountNumberInput.fill(payee.accountNumber);
    await this.verifyAccountNumberInput.fill(verifyAccountNumber ?? payee.accountNumber);
    await this.amountInput.fill(String(amount));
    // The account list is populated by AJAX; selectOption waits for the option to exist.
    await this.fromAccountSelect.selectOption(String(fromAccountId));
    await this.sendPaymentButton.click();
  }
}
