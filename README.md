# owlpay-sdk

TypeScript SDK for the [OwlPay Harbor API](https://owlpay.com). Supports Node.js, Bun, Deno, and browsers.

## Requirements

Node.js ≥ 18, Bun, Deno, or any runtime with native `fetch` and `crypto.subtle`.

## Installation

```bash
npm install owlpay-sdk
# or
bun add owlpay-sdk
```

## Quick start

```ts
import { createOwlPaySDK } from 'owlpay-sdk';

const sdk = createOwlPaySDK(process.env.OWLPAY_API_KEY!, 'sandbox');

// Create a customer
const { data: customer } = await sdk.customers.create({
  type: 'individual',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  phone_country_code: '+1',
  phone_number: '5550001234',
  birth_date: '1990-01-15',
});

// Get a quote
const { data: quotes } = await sdk.quotes.create({
  source: { asset: 'USDC', amount: 100 },
  destination: { country: 'NG', asset: 'NGN' },
});

// Create a transfer
const { data: transfer } = await sdk.transfers.create({
  quote_id: quotes[0]!.id,
  on_behalf_of: customer.uuid,
  application_transfer_uuid: crypto.randomUUID(),
});
```

## Environments

```ts
const sandbox    = createOwlPaySDK('key', 'sandbox');     // default
const production = createOwlPaySDK('key', 'production');
```

> **Note:** `sdk.faucet` and `sdk.transfers.simulatePaid/simulateCompleted` are sandbox-only and will throw if called against a production client.

## Services

| Property | Description |
|----------|-------------|
| `sdk.customers` | Create and retrieve customers |
| `sdk.bankAccounts` | Link bank accounts via widget |
| `sdk.cards` | Bind and manage debit cards |
| `sdk.wallets` | Create and manage crypto wallets |
| `sdk.quotes` | Get transfer quotes |
| `sdk.transfers` | Initiate and track transfers |
| `sdk.webhooks` | Manage webhook subscriptions |
| `sdk.faucet` | Claim test USDC (sandbox only) |

## Quote requirements

Before creating a transfer, call `getRequirements` with the quote ID to retrieve a JSON Schema describing exactly which fields are required for that corridor:

```ts
const schema = await sdk.quotes.getRequirements(quotes[0]!.id);
// schema is a JSON Schema Draft 2020-12 object — validate your transfer payload against it
```

## Pagination

`sdk.wallets.list()`, `sdk.wallets.getRecords()`, and `sdk.transfers.list()` accept optional pagination params:

```ts
const page1 = await sdk.wallets.list({ page: '1', per_page: '20' });
const records = await sdk.wallets.getRecords(walletUuid, { page: '2', per_page: '50' });
const transfers = await sdk.transfers.list({ page: '1', per_page: '10' });
```

`sdk.webhooks.list()` returns a `PaginatedResponse<WebhookSubscription>` with `links` (first/last/prev/next) and `meta` (current_page, per_page, from, to) fields.

## Webhook verification

Always verify incoming webhook payloads before processing. Signature verification confirms the request originated from OwlPay, but you should also implement idempotency (e.g. store processed event IDs) to guard against replay attacks.

```ts
import { verifyWebhookSignature } from 'owlpay-sdk';

// IMPORTANT: You must use express.raw() (not express.json()) so that req.body
// is the unparsed Buffer. Parsing the body before verification will break the
// HMAC check.
app.post('/webhooks/owlpay', express.raw({ type: '*/*' }), async (req, res) => {
  const valid = await verifyWebhookSignature(
    req.body,                                         // Buffer or string — must be raw
    req.headers['harbor-signature'] as string,        // "t=<timestamp>,v1=<hex>"
    process.env.OWLPAY_WEBHOOK_SECRET!,              // never log or hard-code this
  );

  if (!valid) return res.status(401).end();

  const event = JSON.parse(req.body.toString());
  // handle event.type ...
  res.status(200).end();
});
```

The function uses `crypto.subtle.verify` (HMAC-SHA256), which is constant-time in compliant runtimes. Harbor signs `{timestamp}.{body}` and sends the result as `t=<timestamp>,v1=<hex>` in the `harbor-signature` header.

### Webhook event types

| Event type | Description |
|------------|-------------|
| `*` | Subscribe to all events |
| `customer.kyc.verifying` | Customer KYC review started |
| `customer.kyc.verified` | Customer KYC approved |
| `customer.kyc.revoked` | Customer KYC revoked |
| `customer.kyc.rejected` | Customer KYC rejected |
| `customer.kyc.declined` | Customer KYC declined |
| `transfer.status.completed` | Transfer successfully completed |
| `transfer.status.expired` | Transfer expired before completion |
| `transfer.status.on_hold` | Transfer placed on hold |
| `transfer.status.pending_harbor` | Transfer awaiting Harbor processing |
| `transfer.status.rejected` | Transfer rejected |
| `wallet.balance.updated` | Wallet balance changed |

## Error handling

All methods throw on non-2xx responses. The error object includes `status` (HTTP code) and `body` (parsed response):

```ts
import type { OwlPayError } from 'owlpay-sdk';

try {
  await sdk.customers.get('unknown-uuid');
} catch (err) {
  const e = err as OwlPayError;
  console.error(e.status); // 404
  console.error(e.body);   // { message: "Not found", code: "..." }
}
```

Requests are automatically retried up to 3 times on `5xx` and `429` responses with exponential back-off. `Retry-After` headers are respected on 429 responses (both seconds and HTTP-date formats).

## Low-level client

```ts
import { OwlPayClient } from 'owlpay-sdk';

const client = new OwlPayClient('key', 'sandbox');
const data = await client.get<MyType>('/api/v1/some-endpoint');
await client.post('/api/v1/resource', { field: 'value' });
```

## TypeScript

All request and response shapes are fully typed. Import types directly:

```ts
import type {
  Customer,
  Transfer,
  CreateTransferRequest,
  WebhookEventType,
  OwlPayError,
} from 'owlpay-sdk';
```
