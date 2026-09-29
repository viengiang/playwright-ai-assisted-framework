import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface TransferDetails {
  amount: number;
  fromAccountId: number;
  toAccountId: number;
}

export class TransferFundsPage extends BasePage {
  protected readonly path = 'transfer.htm';

  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly toAccountSelect: Locator;
  readonly transferButton: Locator;
  readonly successHeading: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    super(page);
    // Form controls have no <label>/aria-label ("Amount: $" is loose text); ids are the only hook.
    this.amountInput = this.content.locator('#amount');
    this.fromAccountSelect = this.content.locator('#fromAccountId');
    this.toAccountSelect = this.content.locator('#toAccountId');
    this.transferButton = this.content.getByRole('button', { name: 'Transfer' });
    this.successHeading = this.content.getByRole('heading', { name: 'Transfer Complete!' });
    this.confirmation = this.content.locator('#showResult');
  }

  async transfer({ amount, fromAccountId, toAccountId }: TransferDetails): Promise<void> {
    await this.amountInput.fill(String(amount));
    // The account lists are populated by AJAX; selectOption waits for the option to exist.
    await this.fromAccountSelect.selectOption(String(fromAccountId));
    await this.toAccountSelect.selectOption(String(toAccountId));
    await this.transferButton.click();
  }
}
