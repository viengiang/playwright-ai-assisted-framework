import type { APIRequestContext } from '@playwright/test';
import type { NewCustomer } from '@data/builders/customer.builder';

/**
 * ParaBank has no REST endpoint for sign-up, so this posts the public HTML form over HTTP
 * (no browser). Requires a request context whose baseURL is the web app root (`env.appUrl`).
 *
 * The form needs a session: GET it first, then POST. After success the context's cookie jar
 * holds an authenticated JSESSIONID — which is how UI fixtures log the browser in.
 */
export class RegistrationService {
  constructor(private readonly request: APIRequestContext) {}

  async register(customer: NewCustomer): Promise<void> {
    await this.request.get('register.htm');
    const response = await this.request.post('register.htm', {
      form: {
        'customer.firstName': customer.firstName,
        'customer.lastName': customer.lastName,
        'customer.address.street': customer.address.street,
        'customer.address.city': customer.address.city,
        'customer.address.state': customer.address.state,
        'customer.address.zipCode': customer.address.zipCode,
        'customer.phoneNumber': customer.phoneNumber,
        'customer.ssn': customer.ssn,
        'customer.username': customer.username,
        'customer.password': customer.password,
        repeatedPassword: customer.password,
      },
    });
    const html = await response.text();
    if (response.status() === 403 && html.includes('challenges.cloudflare.com')) {
      throw new Error(
        'The public ParaBank instance answered with a Cloudflare bot challenge (rate limiting). ' +
          'Run against the local Docker instance instead: `npm run env:up` + ENV=local.',
      );
    }
    if (!response.ok() || !html.includes('Your account was created successfully')) {
      const errors = [...html.matchAll(/class="error">([^<]+)</g)].map(([, message]) => message);
      throw new Error(
        `Registration of "${customer.username}" failed (HTTP ${String(response.status())}): ` +
          (errors.join(' | ') || 'no validation message returned'),
      );
    }
  }
}
