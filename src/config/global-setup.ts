import { request } from '@playwright/test';
import { env } from './env';

/** A customer that exists in ParaBank's seed data. Used only as a readiness probe, never in tests. */
const SEED_CUSTOMER_ID = 12212;

/**
 * Fails fast with a clear message instead of letting every test time out.
 *
 * - `local`: a fresh ParaBank container starts with an empty database. Seed it once
 *   (idempotent: skipped when the seed customer already exists).
 * - `public`: only checks reachability. Admin endpoints are never called on the shared instance.
 */
export default async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL: env.apiUrl });
  try {
    const probe = await api.get(`customers/${String(SEED_CUSTOMER_ID)}`, {
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
    });
    if (probe.ok()) return;

    if (env.name !== 'local') {
      throw new Error(
        `ParaBank at ${env.apiUrl} is not responding correctly (HTTP ${String(probe.status())}). ` +
          'The public demo may be down; run against Docker instead: `npm run env:up` + ENV=local.',
      );
    }

    const init = await api.post('initializeDB');
    if (!init.ok()) {
      throw new Error(`Could not initialise local ParaBank DB (HTTP ${String(init.status())}).`);
    }
  } finally {
    await api.dispose();
  }
}
