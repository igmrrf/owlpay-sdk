import type { CreateSubscriptionRequest, PaginatedResponse, WebhookSubscription } from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class WebhooksService {
  constructor(private client: OwlPayClient) {}

  list(): Promise<PaginatedResponse<WebhookSubscription>> {
    return this.client.get<PaginatedResponse<WebhookSubscription>>(
      '/api/v1/notifications/subscriptions',
    );
  }

  create(
    req: CreateSubscriptionRequest,
    idempotencyKey?: string,
  ): Promise<{ data: WebhookSubscription }> {
    return this.client.post<{ data: WebhookSubscription }>(
      '/api/v1/notifications/subscriptions',
      req,
      idempotencyKey ? { idempotencyKey } : {},
    );
  }

  get(uuid: string): Promise<{ data: WebhookSubscription }> {
    return this.client.get<{ data: WebhookSubscription }>(
      `/api/v1/notifications/subscriptions/${encodeURIComponent(uuid)}`,
    );
  }

  delete(uuid: string): Promise<{ message: string }> {
    return this.client.delete<{ message: string }>(
      `/api/v1/notifications/subscriptions/${encodeURIComponent(uuid)}`,
    );
  }
}
