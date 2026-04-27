import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type { OwlPayClient } from '../src/client.ts';
import { CustomersService } from '../src/services/customers.service.ts';
import { BankAccountsService } from '../src/services/bank-accounts.service.ts';
import { CardsService } from '../src/services/cards.service.ts';
import { WalletsService } from '../src/services/wallets.service.ts';
import { QuotesService } from '../src/services/quotes.service.ts';
import { TransfersService } from '../src/services/transfers.service.ts';
import { WebhooksService } from '../src/services/webhooks.service.ts';
import { FaucetService } from '../src/services/faucet.service.ts';

// ---------------------------------------------------------------------------
// Shared mock client factory
// ---------------------------------------------------------------------------
// Re-created in beforeEach for each describe block so mock.calls are isolated.

function makeMockClient(environment: 'sandbox' | 'production' = 'sandbox') {
  const mockGet = mock(() => Promise.resolve({ data: {} }));
  const mockPost = mock(() => Promise.resolve({ data: {} }));
  const mockPatch = mock(() => Promise.resolve({ data: {} }));
  const mockDelete = mock(() => Promise.resolve({ message: 'ok' }));

  const client = {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
    environment,
  } as unknown as OwlPayClient;

  return { client, mockGet, mockPost, mockPatch, mockDelete };
}

// ---------------------------------------------------------------------------
// CustomersService
// ---------------------------------------------------------------------------

describe('CustomersService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: CustomersService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new CustomersService(mocks.client);
  });

  describe('create()', () => {
    test('calls POST /api/v1/customers with the request body', async () => {
      const req = { type: 'individual', first_name: 'Alice', email: 'alice@example.com' };
      await service.create(req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/customers');
      expect(body).toEqual(req);
    });

    test('passes idempotency key option when provided', async () => {
      const req = { type: 'business' };
      await service.create(req as never, 'idem-key-123');

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'idem-key-123' });
    });

    test('passes empty options object when no idempotency key given', async () => {
      await service.create({ type: 'individual' } as never);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({});
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'cust_abc', type: 'individual' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.create({ type: 'individual' } as never);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('get()', () => {
    test('calls GET /api/v1/customers/{uuid}', async () => {
      await service.get('cust_xyz');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_xyz');
    });

    test('interpolates different UUIDs correctly', async () => {
      await service.get('00000000-0000-0000-0000-000000000001');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/00000000-0000-0000-0000-000000000001');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'cust_xyz', type: 'individual' } };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.get('cust_xyz');
      expect(result).toEqual(fakeResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// BankAccountsService
// ---------------------------------------------------------------------------

describe('BankAccountsService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: BankAccountsService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new BankAccountsService(mocks.client);
  });

  describe('getWidgetUrl()', () => {
    test('calls POST /api/v1/customers/{uuid}/bank-connections/widget-url', async () => {
      const req = { redirect_url: 'https://example.com/callback' };
      await service.getWidgetUrl('cust_123', req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/customers/cust_123/bank-connections/widget-url');
      expect(body).toEqual(req);
    });

    test('passes idempotency key when provided', async () => {
      await service.getWidgetUrl('cust_123', {} as never, 'idem-bank-456');

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'idem-bank-456' });
    });

    test('passes empty options when no idempotency key given', async () => {
      await service.getWidgetUrl('cust_123', {} as never);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({});
    });

    test('interpolates the customer UUID into the URL', async () => {
      await service.getWidgetUrl('cust_abc999', {} as never);

      const [url] = mocks.mockPost.mock.calls[0] as [string];
      expect(url).toContain('cust_abc999');
    });
  });

  describe('list()', () => {
    test('calls GET /api/v1/customers/{uuid}/linked-bank-accounts', async () => {
      await service.list('cust_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_123/linked-bank-accounts');
    });

    test('interpolates different customer UUIDs correctly', async () => {
      await service.list('cust_different');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_different/linked-bank-accounts');
    });
  });

  describe('get()', () => {
    test('calls GET /api/v1/customers/{uuid}/linked-bank-accounts/{accountId}', async () => {
      await service.get('cust_123', 'acct_456');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_123/linked-bank-accounts/acct_456');
    });

    test('interpolates both customer UUID and account ID', async () => {
      await service.get('cust_abc', 'acct_xyz');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toContain('cust_abc');
      expect(url).toContain('acct_xyz');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { id: 'acct_456', bank_name: 'Test Bank' } };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.get('cust_123', 'acct_456');
      expect(result).toEqual(fakeResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// CardsService
// ---------------------------------------------------------------------------

describe('CardsService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: CardsService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new CardsService(mocks.client);
  });

  describe('bind()', () => {
    test('calls POST /api/v1/customers/{uuid}/cards with the request body', async () => {
      const req = { card_token: 'tok_visa_abc' };
      await service.bind('cust_123', req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/customers/cust_123/cards');
      expect(body).toEqual(req);
    });

    test('passes idempotency key when provided', async () => {
      await service.bind('cust_123', {} as never, 'idem-card-789');

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'idem-card-789' });
    });

    test('passes empty options when no idempotency key given', async () => {
      await service.bind('cust_123', {} as never);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({});
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'card_999', last_four: '4242' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.bind('cust_123', {} as never);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('list()', () => {
    test('calls GET /api/v1/customers/{uuid}/cards', async () => {
      await service.list('cust_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_123/cards');
    });

    test('interpolates different customer UUIDs correctly', async () => {
      await service.list('cust_xyz');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_xyz/cards');
    });
  });

  describe('get()', () => {
    test('calls GET /api/v1/customers/{uuid}/cards/{cardUuid}', async () => {
      await service.get('cust_123', 'card_456');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/customers/cust_123/cards/card_456');
    });

    test('interpolates both customer UUID and card UUID', async () => {
      await service.get('cust_abc', 'card_xyz');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toContain('cust_abc');
      expect(url).toContain('card_xyz');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'card_456', last_four: '1111' } };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.get('cust_123', 'card_456');
      expect(result).toEqual(fakeResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// WalletsService
// ---------------------------------------------------------------------------

describe('WalletsService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: WalletsService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new WalletsService(mocks.client);
  });

  describe('create()', () => {
    test('calls POST /api/v1/wallets with the request body', async () => {
      const req = { currency: 'USDC', description: 'My wallet' };
      await service.create(req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/wallets');
      expect(body).toEqual(req);
    });

    test('passes idempotency key when provided', async () => {
      await service.create({} as never, 'idem-wallet-111');

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'idem-wallet-111' });
    });

    test('passes empty options when no idempotency key given', async () => {
      await service.create({} as never);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({});
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'wlt_abc', currency: 'USDC' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.create({} as never);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('list()', () => {
    test('calls GET /api/v1/wallets without params', async () => {
      await service.list();

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/wallets');
    });

    test('passes pagination params when provided', async () => {
      await service.list({ page: '2', per_page: '20' });

      const [url, params] = mocks.mockGet.mock.calls[0] as [string, Record<string, string>];
      expect(url).toBe('/api/v1/wallets');
      expect(params).toEqual({ page: '2', per_page: '20' });
    });

    test('passes undefined params when none provided', async () => {
      await service.list();

      const [, params] = mocks.mockGet.mock.calls[0] as [string, unknown];
      // When no params are given the service passes `undefined` cast to Record<string,string>
      expect(params).toBeUndefined();
    });
  });

  describe('get()', () => {
    test('calls GET /api/v1/wallets/{uuid}', async () => {
      await service.get('wlt_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/wallets/wlt_123');
    });

    test('interpolates different wallet UUIDs correctly', async () => {
      await service.get('wlt_xyz999');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/wallets/wlt_xyz999');
    });
  });

  describe('update()', () => {
    test('calls PATCH /api/v1/wallets/{uuid} with the update body', async () => {
      const data = { description: 'Updated description' };
      await service.update('wlt_123', data);

      expect(mocks.mockPatch.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPatch.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/wallets/wlt_123');
      expect(body).toEqual(data);
    });

    test('supports updating meta_data field', async () => {
      const data = { meta_data: { env: 'test', version: 2 } };
      await service.update('wlt_abc', data);

      const [url, body] = mocks.mockPatch.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/wallets/wlt_abc');
      expect(body).toEqual(data);
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'wlt_123', description: 'Updated description' } };
      mocks.mockPatch.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.update('wlt_123', { description: 'Updated description' });
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('getBalances()', () => {
    test('calls GET /api/v1/wallets/{uuid}/balances', async () => {
      await service.getBalances('wlt_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/wallets/wlt_123/balances');
    });

    test('interpolates the wallet UUID into the balances path', async () => {
      await service.getBalances('wlt_abc');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toContain('wlt_abc');
      expect(url).toEndWith('/balances');
    });
  });

  describe('getRecords()', () => {
    test('calls GET /api/v1/wallets/{uuid}/records without params', async () => {
      await service.getRecords('wlt_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/wallets/wlt_123/records');
    });

    test('passes pagination params when provided', async () => {
      await service.getRecords('wlt_123', { page: '3', per_page: '5' });

      const [url, params] = mocks.mockGet.mock.calls[0] as [string, Record<string, string>];
      expect(url).toBe('/api/v1/wallets/wlt_123/records');
      expect(params).toEqual({ page: '3', per_page: '5' });
    });
  });
});

// ---------------------------------------------------------------------------
// QuotesService
// ---------------------------------------------------------------------------

describe('QuotesService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: QuotesService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new QuotesService(mocks.client);
  });

  describe('create()', () => {
    test('calls POST /api/v2/transfers/quotes with the request body', async () => {
      const req = {
        source_currency: 'USD',
        target_currency: 'NGN',
        amount: 100,
      };
      await service.create(req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v2/transfers/quotes');
      expect(body).toEqual(req);
    });

    test('does not pass extra options (QuotesService.create takes no idempotency key)', async () => {
      await service.create({} as never);

      // create(req) → client.post(url, req) with no 3rd arg
      expect(mocks.mockPost.mock.calls[0]?.length).toBe(2);
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { id: 'quote_abc', expires_at: '2099-01-01T00:00:00Z' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.create({} as never);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('getRequirements()', () => {
    test('calls GET /api/v2/transfers/quotes/{id}/requirements', async () => {
      await service.getRequirements('quote_abc');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v2/transfers/quotes/quote_abc/requirements');
    });

    test('interpolates different quote IDs correctly', async () => {
      await service.getRequirements('quote_xyz999');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toContain('quote_xyz999');
      expect(url).toEndWith('/requirements');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { fields: [{ key: 'bank_code', required: true }] };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.getRequirements('quote_abc');
      expect(result).toEqual(fakeResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// TransfersService
// ---------------------------------------------------------------------------

describe('TransfersService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: TransfersService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new TransfersService(mocks.client);
  });

  describe('create()', () => {
    const baseReq = {
      quote_id: 'quote_abc',
      on_behalf_of: 'cust_123',
      application_transfer_uuid: 'app-txfr-uuid-001',
    };

    test('calls POST /api/v2/transfers with the request body', async () => {
      await service.create(baseReq);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v2/transfers');
      expect(body).toEqual(baseReq);
    });

    test('uses application_transfer_uuid as idempotency key', async () => {
      await service.create(baseReq);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'app-txfr-uuid-001' });
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'txfr_abc', status: 'pending' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.create(baseReq);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('get()', () => {
    test('calls GET /api/v2/transfers/{uuid}', async () => {
      await service.get('txfr_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v2/transfers/txfr_123');
    });

    test('interpolates different transfer UUIDs correctly', async () => {
      await service.get('txfr_xyz');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v2/transfers/txfr_xyz');
    });
  });

  describe('list()', () => {
    test('calls GET /api/v2/transfers without params', async () => {
      await service.list();

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v2/transfers');
    });

    test('passes filter params when provided', async () => {
      const params = { status: 'completed', page: '1' };
      await service.list(params);

      const [url, receivedParams] = mocks.mockGet.mock.calls[0] as [
        string,
        Record<string, string>,
      ];
      expect(url).toBe('/api/v2/transfers');
      expect(receivedParams).toEqual(params);
    });
  });

  describe('getWithdrawalSettings()', () => {
    test('calls GET /api/v2/transfers/withdrawal_settings', async () => {
      await service.getWithdrawalSettings();

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v2/transfers/withdrawal_settings');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: [{ currency: 'USD', min_amount: 10 }] };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.getWithdrawalSettings();
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('simulatePaid()', () => {
    test('calls POST /api/v1/transfers/{uuid}/simulate-paid', async () => {
      await service.simulatePaid('txfr_123');

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url] = mocks.mockPost.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/transfers/txfr_123/simulate-paid');
    });

    test('interpolates the transfer UUID into simulate-paid path', async () => {
      await service.simulatePaid('txfr_abc');

      const [url] = mocks.mockPost.mock.calls[0] as [string];
      expect(url).toContain('txfr_abc');
      expect(url).toContain('simulate-paid');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { message: 'Transfer marked as paid' };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.simulatePaid('txfr_123');
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('simulateCompleted()', () => {
    test('calls POST /api/v1/transfers/{uuid}/simulate-completed', async () => {
      await service.simulateCompleted('txfr_123');

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url] = mocks.mockPost.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/transfers/txfr_123/simulate-completed');
    });

    test('interpolates the transfer UUID into simulate-completed path', async () => {
      await service.simulateCompleted('txfr_xyz');

      const [url] = mocks.mockPost.mock.calls[0] as [string];
      expect(url).toContain('txfr_xyz');
      expect(url).toContain('simulate-completed');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { message: 'Transfer completed' };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.simulateCompleted('txfr_123');
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('sandbox guards', () => {
    test('simulatePaid throws in production', () => {
      const prodService = new TransfersService(makeMockClient('production').client);
      expect(() => prodService.simulatePaid('txfr_123')).toThrow('sandbox');
    });

    test('simulateCompleted throws in production', () => {
      const prodService = new TransfersService(makeMockClient('production').client);
      expect(() => prodService.simulateCompleted('txfr_123')).toThrow('sandbox');
    });
  });
});

// ---------------------------------------------------------------------------
// WebhooksService
// ---------------------------------------------------------------------------

describe('WebhooksService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: WebhooksService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new WebhooksService(mocks.client);
  });

  describe('list()', () => {
    test('calls GET /api/v1/notifications/subscriptions', async () => {
      await service.list();

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/notifications/subscriptions');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: [{ uuid: 'sub_abc', url: 'https://example.com/hook' }] };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.list();
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('create()', () => {
    test('calls POST /api/v1/notifications/subscriptions with the request body', async () => {
      const req = { url: 'https://example.com/hook', events: ['transfer.completed'] };
      await service.create(req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/notifications/subscriptions');
      expect(body).toEqual(req);
    });

    test('passes idempotency key when provided', async () => {
      await service.create({} as never, 'idem-sub-333');

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({ idempotencyKey: 'idem-sub-333' });
    });

    test('passes empty options when no idempotency key given', async () => {
      await service.create({} as never);

      const [, , opts] = mocks.mockPost.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(opts).toEqual({});
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'sub_new', url: 'https://example.com/hook' } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.create({} as never);
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('get()', () => {
    test('calls GET /api/v1/notifications/subscriptions/{uuid}', async () => {
      await service.get('sub_123');

      expect(mocks.mockGet.mock.calls.length).toBe(1);
      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/notifications/subscriptions/sub_123');
    });

    test('interpolates different subscription UUIDs correctly', async () => {
      await service.get('sub_xyz');

      const [url] = mocks.mockGet.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/notifications/subscriptions/sub_xyz');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { uuid: 'sub_123', url: 'https://example.com/hook' } };
      mocks.mockGet.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.get('sub_123');
      expect(result).toEqual(fakeResponse);
    });
  });

  describe('delete()', () => {
    test('calls DELETE /api/v1/notifications/subscriptions/{uuid}', async () => {
      await service.delete('sub_123');

      expect(mocks.mockDelete.mock.calls.length).toBe(1);
      const [url] = mocks.mockDelete.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/notifications/subscriptions/sub_123');
    });

    test('interpolates different subscription UUIDs correctly', async () => {
      await service.delete('sub_abc');

      const [url] = mocks.mockDelete.mock.calls[0] as [string];
      expect(url).toBe('/api/v1/notifications/subscriptions/sub_abc');
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { message: 'ok' };
      mocks.mockDelete.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.delete('sub_123');
      expect(result).toEqual(fakeResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// FaucetService
// ---------------------------------------------------------------------------

describe('FaucetService', () => {
  let mocks: ReturnType<typeof makeMockClient>;
  let service: FaucetService;

  beforeEach(() => {
    mocks = makeMockClient();
    service = new FaucetService(mocks.client);
  });

  describe('claimUsdc()', () => {
    test('throws in production', () => {
      const prodService = new FaucetService(makeMockClient('production').client);
      expect(() => prodService.claimUsdc({ chain: 'ethereum', address: '0x0', amount: '10' })).toThrow('sandbox');
    });

    test('calls POST /api/v1/applications/faucet/usdc with the request body', async () => {
      const req = { wallet_uuid: 'wlt_abc', amount: 500 };
      await service.claimUsdc(req as never);

      expect(mocks.mockPost.mock.calls.length).toBe(1);
      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/applications/faucet/usdc');
      expect(body).toEqual(req);
    });

    test('calls the faucet endpoint with a different wallet UUID', async () => {
      const req = { wallet_uuid: 'wlt_xyz', amount: 100 };
      await service.claimUsdc(req as never);

      const [url, body] = mocks.mockPost.mock.calls[0] as [string, unknown];
      expect(url).toBe('/api/v1/applications/faucet/usdc');
      expect(body).toEqual(req);
    });

    test('returns the value resolved by the client', async () => {
      const fakeResponse = { data: { transaction_uuid: 'txn_faucet_001', amount: 500 } };
      mocks.mockPost.mockImplementation(() => Promise.resolve(fakeResponse));

      const result = await service.claimUsdc({ wallet_uuid: 'wlt_abc', amount: 500 } as never);
      expect(result).toEqual(fakeResponse);
    });

    test('does not call get, patch, or delete', async () => {
      await service.claimUsdc({ wallet_uuid: 'wlt_abc', amount: 100 } as never);

      expect(mocks.mockGet.mock.calls.length).toBe(0);
      expect(mocks.mockPatch.mock.calls.length).toBe(0);
      expect(mocks.mockDelete.mock.calls.length).toBe(0);
    });
  });
});
