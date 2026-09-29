import type { Locator, Page } from '@playwright/test';

export type AccountServicesLink =
  | 'Open New Account'
  | 'Accounts Overview'
  | 'Transfer Funds'
  | 'Bill Pay'
  | 'Find Transactions'
  | 'Update Contact Info'
  | 'Request Loan'
  | 'Log Out';

/** "Account Services" menu in the left sidebar, shown while logged in. */
export class AccountServicesMenu {
  readonly root: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.root = page.locator('#leftPanel');
    this.welcomeMessage = this.root.getByText(/^Welcome /);
  }

  link(name: AccountServicesLink): Locator {
    return this.root.getByRole('link', { name, exact: true });
  }

  async open(name: AccountServicesLink): Promise<void> {
    await this.link(name).click();
  }
}
