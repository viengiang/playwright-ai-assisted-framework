import { request, type APIResponse } from '@playwright/test';
import { env } from './env';

/** A customer that exists in ParaBank's seed data. Used only as a readiness probe, never in tests. */
const SEED_CUSTOMER_ID = 12212;

const HINT =
  env.name === 'local'
    ? 'Start the local instance with `npm run env:up`.'
    : 'The public demo may be down or rate-limiting; use the local instance (`npm run env:up`, ENV=local).';

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
    let probe: APIResponse;
    try {
      probe = await api.get(`customers/${String(SEED_CUSTOMER_ID)}`, {
        headers: { Accept: 'application/json' },
        failOnStatusCode: false,
      });
    } catch (error) {
      throw new Error(`ParaBank is not reachable at ${env.apiUrl}. ${HINT}`, { cause: error });
    }
    if (probe.ok()) return;

    if (env.name !== 'local') {
      throw new Error(
        `ParaBank at ${env.apiUrl} answered HTTP ${String(probe.status())} to a health probe. ${HINT}`,
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
