-- Per-customer, per-platform delivery tracking for notification campaigns —
-- lets the dashboard show real success/failed/uninstalled counts instead of
-- just "attempted". campaign_id is a real FK (nullable: some future delivery
-- paths, e.g. inactivity/smart-engagement crons, may not always create a
-- campaign row) rather than a bare uuid with no referential integrity.
create table notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references notification_campaigns(id) on delete set null,
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  platform text not null check (platform in ('apple', 'google')),
  message_text text not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'uninstalled')),
  error_details text,
  sent_at timestamptz not null default now()
);

create index idx_notification_deliveries_customer on notification_deliveries(customer_id);
create index idx_notification_deliveries_campaign on notification_deliveries(campaign_id);

-- Writes happen exclusively from the server (service role, inside
-- lib/notifications/deliver.ts) — same pattern as pos_transaction_events:
-- members only get a read policy.
alter table notification_deliveries enable row level security;

create policy "notification_deliveries: members can read" on notification_deliveries
  for select using (is_merchant_member(merchant_id));
