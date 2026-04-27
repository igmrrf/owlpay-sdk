import type { FaucetRequest, FaucetResponse } from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class FaucetService {
  constructor(private client: OwlPayClient) {}

  claimUsdc(req: FaucetRequest): Promise<{ data: FaucetResponse }> {
    if (this.client.environment === 'production') {
      throw new Error('claimUsdc is only available in the sandbox environment');
    }
    return this.client.post<{ data: FaucetResponse }>(
      '/api/v1/applications/faucet/usdc',
      req,
    );
  }
}
