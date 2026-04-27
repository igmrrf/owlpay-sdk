import type {
  BankWidgetRequest,
  BankWidgetResponse,
  LinkedBankAccountsResponse,
  LinkedBankAccount,
} from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class BankAccountsService {
  constructor(private client: OwlPayClient) {}

  getWidgetUrl(
    customerUuid: string,
    req: BankWidgetRequest,
    idempotencyKey?: string,
  ): Promise<BankWidgetResponse> {
    return this.client.post<BankWidgetResponse>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/bank-connections/widget-url`,
      req,
      idempotencyKey ? { idempotencyKey } : {},
    );
  }

  list(customerUuid: string): Promise<LinkedBankAccountsResponse> {
    return this.client.get<LinkedBankAccountsResponse>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/linked-bank-accounts`,
    );
  }

  get(customerUuid: string, accountId: string): Promise<{ data: LinkedBankAccount }> {
    return this.client.get<{ data: LinkedBankAccount }>(
      `/api/v1/customers/${encodeURIComponent(customerUuid)}/linked-bank-accounts/${encodeURIComponent(accountId)}`,
    );
  }
}
