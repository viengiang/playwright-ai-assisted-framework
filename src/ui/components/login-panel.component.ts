import type { Locator, Page } from '@playwright/test';

/** "Customer Login" box in the left sidebar, shown while logged out. */
export class LoginPanel {
  readonly root: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('#leftPanel');
    // ParaBank renders the labels as sibling <p> elements with no <label for>, so the inputs
    // have no accessible name; `name` is the most stable attribute available.
    this.usernameInput = this.root.locator('input[name="username"]');
    this.passwordInput = this.root.locator('input[name="password"]');
    this.loginButton = this.root.getByRole('button', { name: 'Log In' });
    this.registerLink = this.root.getByRole('link', { name: 'Register' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
