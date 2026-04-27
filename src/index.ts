export * from './types.ts';
export { OwlPayClient } from './client.ts';
export { verifyWebhookSignature } from './verify-webhook.ts';
export { CustomersService } from './services/customers.service.ts';
export { BankAccountsService } from './services/bank-accounts.service.ts';
export { CardsService } from './services/cards.service.ts';
export { WalletsService } from './services/wallets.service.ts';
export { QuotesService } from './services/quotes.service.ts';
export { TransfersService } from './services/transfers.service.ts';
export { WebhooksService } from './services/webhooks.service.ts';
export { FaucetService } from './services/faucet.service.ts';

import { OwlPayClient } from './client.ts';
import { CustomersService } from './services/customers.service.ts';
import { BankAccountsService } from './services/bank-accounts.service.ts';
import { CardsService } from './services/cards.service.ts';
import { WalletsService } from './services/wallets.service.ts';
import { QuotesService } from './services/quotes.service.ts';
import { TransfersService } from './services/transfers.service.ts';
import { WebhooksService } from './services/webhooks.service.ts';
import { FaucetService } from './services/faucet.service.ts';

export interface OwlPaySDK {
  customers: CustomersService;
  bankAccounts: BankAccountsService;
  cards: CardsService;
  wallets: WalletsService;
  quotes: QuotesService;
  transfers: TransfersService;
  webhooks: WebhooksService;
  faucet: FaucetService;
}

/**
 * Create a fully configured OwlPay SDK instance.
 * @param apiKey - Your OwlPay API key. Store in an environment variable; never hard-code.
 * @param environment - `'sandbox'` (default) or `'production'`
 * @example
 * const sdk = createOwlPaySDK(process.env.OWLPAY_API_KEY!, 'production');
 */
export function createOwlPaySDK(
  apiKey: string,
  environment: 'sandbox' | 'production' = 'sandbox',
): OwlPaySDK {
  const client = new OwlPayClient(apiKey, environment);
  return {
    customers: new CustomersService(client),
    bankAccounts: new BankAccountsService(client),
    cards: new CardsService(client),
    wallets: new WalletsService(client),
    quotes: new QuotesService(client),
    transfers: new TransfersService(client),
    webhooks: new WebhooksService(client),
    faucet: new FaucetService(client),
  };
}
