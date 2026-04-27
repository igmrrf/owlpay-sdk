import type { QuoteRequest, QuoteResponse } from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class QuotesService {
  constructor(private client: OwlPayClient) {}

  create(req: QuoteRequest): Promise<QuoteResponse> {
    return this.client.post<QuoteResponse>('/api/v2/transfers/quotes', req);
  }

  getRequirements(quoteId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(
      `/api/v2/transfers/quotes/${encodeURIComponent(quoteId)}/requirements`,
    );
  }
}
