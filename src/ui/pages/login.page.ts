import type { Locator, Page } from '@playwright/test';
import { LoginPanel } from '@components/login-panel.component';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = 'index.htm';

  readonly loginPanel: LoginPanel;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.loginPanel = new LoginPanel(page);
    // The error <p> has no role or test id; its `error` class is the only distinguishing hook.
    this.errorMessage = this.content.locator('p.error');
  }

  async login(username: string, password: string): Promise<void> {
    await this.loginPanel.login(username, password);
  }
}
