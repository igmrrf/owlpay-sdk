import type { CreateTransferRequest, TransferResponse, WithdrawalSetting } from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class TransfersService {
  constructor(private client: OwlPayClient) {}

  create(req: CreateTransferRequest): Promise<TransferResponse> {
    return this.client.post<TransferResponse>('/api/v2/transfers', req, {
      idempotencyKey: req.application_transfer_uuid,
    });
  }

  get(uuid: string): Promise<TransferResponse> {
    return this.client.get<TransferResponse>(`/api/v2/transfers/${encodeURIComponent(uuid)}`);
  }

  list(params?: Record<string, string>): Promise<{ data: TransferResponse['data'][] }> {
    return this.client.get<{ data: TransferResponse['data'][] }>('/api/v2/transfers', params);
  }

  getWithdrawalSettings(): Promise<{ data: WithdrawalSetting[] }> {
    return this.client.get<{ data: WithdrawalSetting[] }>(
      '/api/v2/transfers/withdrawal_settings',
    );
  }

  simulatePaid(uuid: string): Promise<{ message: string }> {
    if (this.client.environment === 'production') {
      throw new Error('simulatePaid is only available in the sandbox environment');
    }
    return this.client.post<{ message: string }>(
      `/api/v1/transfers/${encodeURIComponent(uuid)}/simulate-paid`,
    );
  }

  simulateCompleted(uuid: string): Promise<{ message: string }> {
    if (this.client.environment === 'production') {
      throw new Error('simulateCompleted is only available in the sandbox environment');
    }
    return this.client.post<{ message: string }>(
      `/api/v1/transfers/${encodeURIComponent(uuid)}/simulate-completed`,
    );
  }
}
