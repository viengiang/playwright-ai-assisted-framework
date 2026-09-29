import { expect, type Locator, type Page } from '@playwright/test';
import type { AccountType } from '@api/models/account.model';
import { BasePage } from './base.page';

export class OpenAccountPage extends BasePage {
  protected readonly path = 'openaccount.htm';

  readonly accountTypeSelect: Locator;
  readonly fundingAccountSelect: Locator;
  readonly openAccountButton: Locator;
  readonly successHeading: Locator;
  readonly newAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    // The two <select>s are unlabeled (the question text is a plain <p>); ids are the only hook.
    this.accountTypeSelect = this.content.locator('#type');
    this.fundingAccountSelect = this.content.locator('#fromAccountId');
    this.openAccountButton = this.content.getByRole('button', { name: 'Open New Account' });
    this.successHeading = this.content.getByRole('heading', { name: 'Account Opened!' });
    this.newAccountLink = this.content.locator('#newAccountId');
  }

  /** Opens an account and returns its number once the confirmation is rendered. */
  async openAccount(type: AccountType, fundingAccountId: number): Promise<number> {
    await this.accountTypeSelect.selectOption(type);
    // selectOption waits until the AJAX-loaded option exists, so no explicit wait is needed.
    await this.fundingAccountSelect.selectOption(String(fundingAccountId));
    await this.openAccountButton.click();
    // Readiness, not a business assertion: the number is filled in after the AJAX call returns.
    await expect(this.newAccountLink).toHaveText(/^\d+$/);
    return Number(await this.newAccountLink.textContent());
  }
}
