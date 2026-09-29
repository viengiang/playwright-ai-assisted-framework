import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const EnvSchema = z.object({
  ENV: z.enum(['public', 'local']).default('public'),
  PARABANK_PORT: z.coerce.number().int().positive().default(8090),
  BASE_URL: z.url().optional(),
  CI: z.stringbool().default(false),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

const vars = parsed.data;

const origins: Record<typeof vars.ENV, string> = {
  public: 'https://parabank.parasoft.com',
  local: `http://localhost:${String(vars.PARABANK_PORT)}`,
};

const origin = (vars.BASE_URL ?? origins[vars.ENV]).replace(/\/+$/, '');

/** Single source of runtime configuration. Nothing else reads `process.env`. */
export const env = {
  name: vars.ENV,
  isCI: vars.CI,
  /** Web app root, with trailing slash so relative paths like `overview.htm` resolve under it. */
  appUrl: `${origin}/parabank/`,
  /** REST API root, with trailing slash so relative paths like `accounts/1` resolve under it. */
  apiUrl: `${origin}/parabank/services/bank/`,
} as const;
