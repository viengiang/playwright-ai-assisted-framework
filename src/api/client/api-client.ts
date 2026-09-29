import type { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';

type QueryParams = Record<string, string | number | boolean>;

/**
 * Thin wrapper over Playwright's APIRequestContext.
 *
 * - Paths are relative to the context's `baseURL` (the REST root).
 * - Never throws on HTTP status: negative tests need the raw response.
 * - `parse()` is the single place where "expected success" responses are checked and validated.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(path: string, params?: QueryParams): Promise<APIResponse> {
    return this.request.get(path, {
      params: params ?? {},
      headers: this.headers,
      failOnStatusCode: false,
    });
  }

  post(path: string, params?: QueryParams): Promise<APIResponse> {
    return this.request.post(path, {
      params: params ?? {},
      headers: this.headers,
      failOnStatusCode: false,
    });
  }

  /** Asserts a 2xx status, then validates the JSON body against `schema` and returns it typed. */
  async parse<S extends z.ZodType>(response: APIResponse, schema: S): Promise<z.infer<S>> {
    const request = `${response.url()} -> HTTP ${String(response.status())}`;
    if (!response.ok()) {
      throw new Error(`Expected a successful response: ${request}\n${await response.text()}`);
    }
    const result = schema.safeParse(await response.json());
    if (!result.success) {
      throw new Error(
        `Response does not match schema: ${request}\n${z.prettifyError(result.error)}`,
      );
    }
    return result.data;
  }

  private get headers(): Record<string, string> {
    // ParaBank serves XML by default; JSON must be requested explicitly.
    return { Accept: 'application/json' };
  }
}
