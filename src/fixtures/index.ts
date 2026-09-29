import { test as base, type APIRequestContext } from '@playwright/test';
import { env } from '@config/env';
import { ApiClient } from '@api/client/api-client';
import { AccountService } from '@api/services/account.service';
import { CustomerService } from '@api/services/customer.service';
import { RegistrationService } from '@api/services/registration.service';
import { TransferService } from '@api/services/transfer.service';
import { CustomerBuilder, type NewCustomer } from '@data/builders/customer.builder';
import { AccountsOverviewPage } from '@pages/accounts-overview.page';
import { LoginPage } from '@pages/login.page';
import { OpenAccountPage } from '@pages/open-account.page';
import { RegisterPage } from '@pages/register.page';
import { TransferFundsPage } from '@pages/transfer-funds.page';

export interface Api {
  customers: CustomerService;
  accounts: AccountService;
  transfers: TransferService;
}

/** A customer created for one test, plus the ids ParaBank assigned to it. */
export interface RegisteredCustomer extends NewCustomer {
  id: number;
  /** The CHECKING account ParaBank opens automatically at sign-up. */
  primaryAccountId: number;
}

interface Fixtures {
  api: Api;
  /** Fresh customer registered over HTTP. The browser is NOT logged in. */
  customer: RegisteredCustomer;
  /** Fresh customer registered through the browser context, so the page is already logged in. */
  signedInCustomer: RegisteredCustomer;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountsOverviewPage: AccountsOverviewPage;
  openAccountPage: OpenAccountPage;
  transferFundsPage: TransferFundsPage;
}

async function registerCustomer(request: APIRequestContext, api: Api): Promise<RegisteredCustomer> {
  const data = new CustomerBuilder().build();
  await new RegistrationService(request).register(data);
  const { id } = await api.customers.login(data.username, data.password);
  const [primaryAccount] = await api.customers.getAccounts(id);
  if (!primaryAccount) throw new Error(`Customer ${String(id)} was created without an account`);
  return { ...data, id, primaryAccountId: primaryAccount.id };
}

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: env.apiUrl });
    const client = new ApiClient(request);
    await use({
      customers: new CustomerService(client),
      accounts: new AccountService(client),
      transfers: new TransferService(client),
    });
    await request.dispose();
  },

  customer: async ({ playwright, api }, use) => {
    const request = await playwright.request.newContext({ baseURL: env.appUrl });
    const customer = await registerCustomer(request, api);
    await request.dispose();
    await use(customer);
  },

  signedInCustomer: async ({ context, api }, use) => {
    // context.request shares the browser's cookie jar: the session created by sign-up
    // authenticates the page without going through the login form.
    await use(await registerCustomer(context.request, api));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  accountsOverviewPage: async ({ page }, use) => {
    await use(new AccountsOverviewPage(page));
  },
  openAccountPage: async ({ page }, use) => {
    await use(new OpenAccountPage(page));
  },
  transferFundsPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },
});

export { expect } from '@playwright/test';
