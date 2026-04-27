import type {
  CreateWalletRequest,
  Wallet,
  WalletBalance,
  WalletRecord,
} from '../types.ts';
import type { OwlPayClient } from '../client.ts';

function cleanParams(
  params: Record<string, string | undefined> | undefined,
): Record<string, string> | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export class WalletsService {
  constructor(private client: OwlPayClient) {}

  create(req: CreateWalletRequest, idempotencyKey?: string): Promise<{ data: Wallet }> {
    return this.client.post<{ data: Wallet }>('/api/v1/wallets', req, idempotencyKey ? { idempotencyKey } : {});
  }

  list(params?: { page?: string; per_page?: string }): Promise<{ data: Wallet[] }> {
    return this.client.get<{ data: Wallet[] }>('/api/v1/wallets', cleanParams(params));
  }

  get(uuid: string): Promise<{ data: Wallet }> {
    return this.client.get<{ data: Wallet }>(`/api/v1/wallets/${encodeURIComponent(uuid)}`);
  }

  update(
    uuid: string,
    data: { description?: string | undefined; meta_data?: Record<string, unknown> | undefined },
  ): Promise<{ data: Wallet }> {
    return this.client.patch<{ data: Wallet }>(`/api/v1/wallets/${encodeURIComponent(uuid)}`, data);
  }

  getBalances(uuid: string): Promise<{ data: WalletBalance[] }> {
    return this.client.get<{ data: WalletBalance[] }>(`/api/v1/wallets/${encodeURIComponent(uuid)}/balances`);
  }

  getRecords(
    uuid: string,
    params?: { page?: string; per_page?: string },
  ): Promise<{ data: WalletRecord[] }> {
    return this.client.get<{ data: WalletRecord[] }>(
      `/api/v1/wallets/${encodeURIComponent(uuid)}/records`,
      cleanParams(params),
    );
  }
}
