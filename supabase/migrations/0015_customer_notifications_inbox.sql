-- Persistent record of every notification/offer sent to a customer — a
-- lock-screen push disappears once dismissed, but the merchant's offer
-- shouldn't. Backs the Wallet pass backfield ("offres en cours"), the
-- /my-offers/[cardId] hub page, and is the source of truth both read from.
create table customer_notifications_inbox (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  merchant_id uuid not null references merchants (id) on delete cascade,
  title text,
  message text not null,
  offer_code text,
  discount text,
  expires_at timestamptz,
  is_used boolean not null default false,
  created_at timestamptz not null default now()
);

create index customer_notifications_inbox_customer_id_idx on customer_notifications_inbox (customer_id);
create index customer_notifications_inbox_merchant_id_idx on customer_notifications_inbox (merchant_id);

alter table customer_notifications_inbox enable row level security;

-- Written by the service role only (from lib/notifications/deliver.ts,
-- alongside the existing notification_deliveries insert) — merchants only
-- ever need read access, e.g. a future "offer history" dashboard view.
create policy "customer_notifications_inbox: members can read" on customer_notifications_inbox
  for select using (is_merchant_member(merchant_id));
