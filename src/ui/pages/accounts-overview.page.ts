import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AccountsOverviewPage extends BasePage {
  protected readonly path = 'overview.htm';

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.content.getByRole('heading', { name: 'Accounts Overview' });
  }

  /** Table row for an account, found by its account-number link (rows load via AJAX). */
  accountRow(accountId: number): Locator {
    return this.content
      .getByRole('row')
      .filter({ has: this.page.getByRole('link', { name: String(accountId), exact: true }) });
  }
}
