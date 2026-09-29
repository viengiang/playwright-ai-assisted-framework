import type { APIResponse } from '@playwright/test';
import type { ApiClient } from '@api/client/api-client';
import type { TransferRequest } from '@api/models/transaction.model';

/** `POST /transfer`. The endpoint answers with a plain-text message, not JSON. */
export class TransferService {
  constructor(private readonly client: ApiClient) {}

  transferResponse(request: TransferRequest): Promise<APIResponse> {
    return this.client.post('transfer', { ...request });
  }

  /** Performs the transfer and returns the confirmation message. Throws on a non-2xx status. */
  async transfer(request: TransferRequest): Promise<string> {
    const response = await this.transferResponse(request);
    const body = await response.text();
    if (!response.ok()) {
      throw new Error(`Transfer failed (HTTP ${String(response.status())}): ${body}`);
    }
    return body;
  }
}
