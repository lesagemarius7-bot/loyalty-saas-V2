-- Deep basket data: real line-item capture from POS payment webhooks.
--
-- Two deviations from a literal reading of the feature spec, both because
-- the table it names doesn't exist in this schema:
--   - No "customer_cards" table exists — the per-card table is
--     loyalty_cards, and the per-customer *behavior* table (which is what
--     favorite_sku/total_lifetime_spent actually are) is
--     customer_purchase_habits, already populated by every payment webhook
--     via lib/customers/purchase-habits.ts. Both new columns go there,
--     not on loyalty_cards, to stay consistent with that existing split
--     (loyalty_cards = the pass itself; customer_purchase_habits = derived
--     behavior signals).
--   - transaction_line_items links to the REAL transactions row created by
--     the same webhook call (lib/payments/process-payment-success.ts
--     already inserts one when points are earned) via a proper FK
--     (transaction_id), not a free-text transaction_ref — both sides are
--     created in the same request, so there's no reason to use a loose
--     text join instead of a real one.
alter table customer_purchase_habits
  add column favorite_sku text,
  add column total_lifetime_spent numeric(10, 2) not null default 0.00;

comment on column customer_purchase_habits.favorite_sku is 'Most frequently purchased SKU, recomputed from transaction_line_items on every payment webhook call.';
comment on column customer_purchase_habits.total_lifetime_spent is 'Running total of transaction_amount across every payment webhook call for this customer.';

create table transaction_line_items (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete cascade,
  sku text not null,
  product_name text not null,
  quantity int not null default 1,
  unit_price numeric(10, 2) not null default 0.00,
  category text,
  purchased_at timestamptz not null default now()
);

create index idx_line_items_customer on transaction_line_items(customer_id);
create index idx_line_items_merchant on transaction_line_items(merchant_id);
create index idx_line_items_merchant_sku on transaction_line_items(merchant_id, sku);

alter table transaction_line_items enable row level security;

create policy "transaction_line_items: members can read" on transaction_line_items
  for select using (is_merchant_member(merchant_id));

-- Drives the wallet pass back-field "next best item" nudge — a real,
-- computed suggestion (see process-payment-success.ts), not a static
-- per-program field like back_terms/back_address. Lives on loyalty_cards
-- (not customer_purchase_habits) because lib/wallet/card-lookup.ts already
-- select('*')s loyalty_cards for pass generation — putting it here means
-- Apple/Google pass generation picks it up with zero query changes.
alter table loyalty_cards add column next_best_item_message text;

comment on column loyalty_cards.next_best_item_message is 'Computed "next best item" suggestion surfaced on the Wallet pass back — see computeNextBestItem in process-payment-success.ts.';
