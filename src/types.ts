// ─── Customer Types ───────────────────────────────────────────────────────────

export type CustomerStatus =
  | 'deactivated'
  | 'unfinished'
  | 'finished'
  | 'verifying'
  | 'verified'
  | 'rejected'
  | 'declined'
  | 'request_for_information';

export interface CreateCustomerRequest {
  type: 'individual';
  first_name: string;
  middle_name?: string | undefined;
  last_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  birth_date: string; // YYYY-MM-DD
  description?: string | undefined;
}

export interface Customer {
  uuid: string;
  status: CustomerStatus;
  type: 'individual';
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  birth_date: string;
  has_signed_agreement: boolean;
  agreement_link: string;
  kyc_link: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerResponse {
  data: Customer;
}

// ─── Bank Account Types ───────────────────────────────────────────────────────

export interface BankWidgetRequest {
  redirect_url: {
    success: string;
    failed: string;
  };
}

export interface BankWidgetResponse {
  data: {
    widget_url: string;
  };
}

export interface LinkedBankAccount {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS';
  connection: {
    institution_name: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
    is_syncing: boolean;
    last_synced_at: string;
  };
}

export interface LinkedBankAccountsResponse {
  data: LinkedBankAccount[];
}

// ─── Card Types ───────────────────────────────────────────────────────────────

export type CardStatus = 'pending' | 'active' | 'expired' | 'disabled' | 'restricted';

export interface CustomerCard {
  uuid: string;
  object: 'customer_card';
  customer_uuid: string;
  status: CardStatus;
  last4_digits: string | null;
  card_company: string | null;
  pull_enabled: boolean;
  push_enabled: boolean;
  first_name: string | null;
  last_name: string | null;
  country_code: string | null;
  issuer_country_code: string | null;
  enabled: boolean;
  restricted: boolean;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BindCardRequest {
  redirect_url: {
    success: string;
    failed: string;
  };
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export type Chain =
  | 'ethereum'
  | 'arbitrum'
  | 'polygon'
  | 'avalanche'
  | 'optimism'
  | 'stellar'
  | 'solana';

export interface CreateWalletRequest {
  chain: Chain;
  description?: string | undefined;
  application_reference_id?: string | undefined;
  meta_data?: Record<string, unknown> | undefined;
}

export interface Wallet {
  uuid: string;
  chain: string;
  address: string;
  memo: string | null;
  description: string | null;
  application_reference_id: string | null;
  meta_data: Record<string, unknown> | null;
  created_at: string;
}

export interface WalletBalance {
  asset: string;
  total_amount: string;
}

export interface WalletRecord {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: string;
  token_symbol: string;
  from_address: string;
  to_address: string;
  tx_hash: string;
  chain: string;
  created_at: string;
}

// ─── Quote Types ──────────────────────────────────────────────────────────────

export type PaymentMethod = 'ON_CHAIN' | 'WIRE' | 'ACH_PULL' | 'DEBIT_CARD';

export interface QuoteRequest {
  source: {
    country?: string;
    chain?: string;
    asset: string;
    amount?: number;
    type?: 'individual' | 'business';
  };
  destination: {
    country?: string;
    chain?: string;
    asset: string;
    amount?: number;
    type?: 'individual' | 'business';
  };
  commission?: {
    percentage?: number;
    amount?: number;
  };
}

export interface QuoteFee {
  type: 'HARBOR_FEE' | 'COMMISSION_FEE';
  amount: string;
  currency: string;
  charge_from: string;
  payer: string;
}

export interface CustomerLimits {
  per_transaction_limit: string;
  daily_limit: string;
  weekly_limit: string;
  monthly_limit: string;
  daily_spent: string;
  daily_remaining: string;
  weekly_spent: string;
  weekly_remaining: string;
  monthly_spent: string;
  monthly_remaining: string;
  current_remaining: string;
}

export interface QuoteItem {
  id: string;
  payment_method: PaymentMethod;
  chain: string | null;
  source_country: string | null;
  destination_country: string | null;
  source_amount: string;
  source_currency: string;
  destination_amount: string;
  destination_currency: string;
  destination_chain: string | null;
  exchange_rate: string;
  exchange_pair: string;
  crypto_settlement_time_min: number | null;
  crypto_settlement_time_max: number | null;
  crypto_settlement_time_unit: 'MINUTES' | null;
  fiat_settlement_time_min: number | null;
  fiat_settlement_time_max: number | null;
  fiat_settlement_time_unit: 'DAYS' | null;
  source_type: 'individual' | 'business' | null;
  destination_type: 'individual' | 'business' | null;
  quote_expire_date: string;
  crypto_funds_settlement_expire_date: string | null;
  fees: QuoteFee[];
  customer_limits?: CustomerLimits;
  created_at: string;
  updated_at: string;
}

export interface QuoteResponse {
  data: QuoteItem[];
}

// ─── Transfer Types ───────────────────────────────────────────────────────────

export type TransferStatus =
  | 'pending_customer_transfer_start'
  | 'pending_customer_transfer_complete'
  | 'pending_external'
  | 'pending_harbor'
  | 'on_hold'
  | 'request_for_information'
  | 'pending_customer'
  | 'completed'
  | 'refunded'
  | 'expired'
  | 'cancelled'
  | 'reject'
  | 'error';

export type TransferPurpose =
  | 'TRANSFER_TO_OWN_ACCOUNT'
  | 'FAMILY_MAINTENANCE'
  | 'EDUCATION'
  | 'MEDICAL_TREATMENT'
  | 'HOTEL'
  | 'TRAVEL'
  | 'REPAYMENT_OF_LOANS'
  | 'TAX_PAYMENT'
  | 'PURCHASE_PROPERTY'
  | 'PROPERTY_RENTAL'
  | 'INSURANCE_PREMIUM'
  | 'PRODUCT_INDEMNITY_INSURANCE'
  | 'INSURANCE_CLAIMS'
  | 'MUTUAL_FUND_INVESTMENT'
  | 'INVESTMENT_SHARES'
  | 'DONATIONS'
  | 'SALARY'
  | 'INFO_SERVICE'
  | 'ADVERTISING'
  | 'ROYALTY_FEES'
  | 'BROKER_FEES'
  | 'ADVISOR_FEES'
  | 'REPRESENTATIVE_EXPENSES'
  | 'CONSTRUCTION'
  | 'TRANSPORTATION'
  | 'EXPORTED_GOODS'
  | 'DELIVERY_FEES'
  | 'GENERAL_GOODS_OFFLINE';

export interface TransferFee {
  type: 'HARBOR_FEE' | 'COMMISSION_FEE';
  amount: string;
  currency: string;
}

export interface TransferReceipt {
  initial_asset: string;
  initial_amount: string;
  commission_fee: string;
  harbor_fee: string;
  final_asset: string;
  final_amount: string;
  exchange_rate: string;
  transaction_hash: string | null;
}

export interface BeneficiaryInfo {
  beneficiary_name: string;
  beneficiary_dob: string;
  beneficiary_id_doc_number: string;
  beneficiary_address: {
    street: string;
    city: string;
    state_province?: string;
    postal_code?: string;
    country: string;
  };
}

export interface OnRampWireInstructions {
  account_number: string;
  routing_number: string;
  bank_name: string;
  bank_address: string;
  account_holder_name: string;
  narrative: string;
}

export interface OnChainInstructions {
  instruction_chain: string;
  instruction_address: string;
  instruction_memo: string | null;
}

export interface Transfer {
  uuid: string;
  object: 'transfer';
  status: TransferStatus;
  type: 'on-ramp' | 'off-ramp' | 'swap';
  settlement_strategy?: string;
  source_received?: boolean;
  on_behalf_of: string;
  source: {
    asset: string;
    amount: string;
    chain?: string;
  };
  destination: {
    asset: string;
    amount: string;
    chain?: string;
    country?: string;
    payout_instrument?: Record<string, unknown>;
    beneficiary_info?: BeneficiaryInfo;
    is_self_transfer?: boolean;
    transfer_purpose?: TransferPurpose;
  };
  application_transfer_uuid: string;
  transfer_instructions: OnRampWireInstructions | OnChainInstructions | Record<string, unknown>;
  rfi_link?: string;
  commission: { percentage: string; amount: string };
  fees: TransferFee[];
  receipt: TransferReceipt;
  meta_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TransferResponse {
  data: Transfer;
}

// ─── Webhook Types ────────────────────────────────────────────────────────────

export type WebhookEventType =
  | '*'
  | 'customer.kyc.verifying'
  | 'customer.kyc.verified'
  | 'customer.kyc.revoked'
  | 'customer.kyc.rejected'
  | 'customer.kyc.declined'
  | 'transfer.status.completed'
  | 'transfer.status.expired'
  | 'transfer.status.on_hold'
  | 'transfer.status.pending_harbor'
  | 'transfer.status.rejected'
  | 'wallet.balance.updated';

export interface WebhookSubscription {
  uuid: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  notification_types: string[];
  restricted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionRequest {
  name?: string | undefined;
  endpoint: string;
  notification_types: WebhookEventType[];
}

// ─── Faucet Types ─────────────────────────────────────────────────────────────

export interface FaucetRequest {
  chain: string;
  address: string;
  amount: string;
}

export interface FaucetResponse {
  chain: string;
  address: string;
  amount: string;
  daily_used: string;
  daily_remaining: string;
  daily_limit: string;
  circle_payout_id: string;
}

// ─── Transfer Request ─────────────────────────────────────────────────────────

export interface CreateTransferRequest {
  quote_id: string;
  on_behalf_of: string;
  application_transfer_uuid: string;
  destination?: {
    payout_instrument?: Record<string, unknown>;
    beneficiary_info?: BeneficiaryInfo;
    is_self_transfer?: boolean;
    transfer_purpose?: TransferPurpose;
  };
  meta_data?: Record<string, unknown> | undefined;
}

// ─── Withdrawal Settings ──────────────────────────────────────────────────────

export interface WithdrawalSetting {
  source_currency: string;
  destination_country: string;
  destination_currency: string;
  source_type: 'individual' | 'business';
  destination_type: 'individual' | 'business';
  source_amount: {
    currency: string;
    min: number;
    max: number;
  };
  destination_amount: {
    currency: string;
    min: number;
    max: number;
  };
}

// ─── Commission Types ─────────────────────────────────────────────────────────

export interface CommissionConfig {
  percentage: number;
  amount: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface OwlPayError {
  message: string;
  code?: string;
  status: number;
  body?: unknown;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    path: string;
  };
}
