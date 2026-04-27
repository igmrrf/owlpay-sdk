import type {
  CreateCustomerRequest,
  CustomerResponse,
} from '../types.ts';
import type { OwlPayClient } from '../client.ts';

export class CustomersService {
  constructor(private client: OwlPayClient) {}

  create(req: CreateCustomerRequest, idempotencyKey?: string): Promise<CustomerResponse> {
    return this.client.post<CustomerResponse>('/api/v1/customers', req, idempotencyKey ? { idempotencyKey } : {});
  }

  get(uuid: string): Promise<CustomerResponse> {
    return this.client.get<CustomerResponse>(`/api/v1/customers/${encodeURIComponent(uuid)}`);
  }
}
