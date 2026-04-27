import type { BindCardRequest, CustomerCard } from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class CardsService {
  constructor(private client: OwlPayClient) {}

  bind(
    customerUuid: string,
    req: BindCardRequest,
    idempotencyKey?: string,
  ): Promise<{ data: CustomerCard }> {
    return this.client.post<{ data: CustomerCard }>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/cards`,
      req,
      idempotencyKey ? { idempotencyKey } : {},
    );
  }

  list(customerUuid: string): Promise<{ data: CustomerCard[] }> {
    return this.client.get<{ data: CustomerCard[] }>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/cards`,
    );
  }

  get(customerUuid: string, cardUuid: string): Promise<{ data: CustomerCard }> {
    return this.client.get<{ data: CustomerCard }>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/cards/${encodeURIComponent(cardUuid)}`,
    );
  }
}
