import type { Locator, Page } from '@playwright/test';
import { AccountServicesMenu } from '@components/account-services-menu.component';

/** Shared layout: every ParaBank page has a sidebar (#leftPanel) and a content area (#rightPanel). */
export abstract class BasePage {
  /** Path relative to the app root (`env.appUrl`), e.g. `overview.htm`. */
  protected abstract readonly path: string;

  readonly menu: AccountServicesMenu;
  readonly content: Locator;
  readonly errorHeading: Locator;

  constructor(readonly page: Page) {
    this.menu = new AccountServicesMenu(page);
    this.content = page.locator('#rightPanel');
    this.errorHeading = this.content.getByRole('heading', { name: 'Error!' });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }
}
