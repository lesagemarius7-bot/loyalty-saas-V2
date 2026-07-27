-- First brick of Wallet-based marketing notifications: manual/broadcast
-- campaigns. A merchant writes a message once and it's fanned out to every
-- customer's card. Scheduled campaigns (inactivity re-engagement, targeted
-- offers) can reuse this same delivery primitive later — they'd just set
-- last_message on a filtered set of cards instead of all of them.

-- Surfaced on the Apple Wallet pass as a back-of-pass field with a
-- changeMessage template — when this value changes and the device re-fetches
-- the pass (after a push), iOS shows a lock-screen notification with the new
-- text. Google Wallet doesn't need this column (its addMessage API stores the
-- message on Google's side), but last_message_at still lets the dashboard
-- show "last notified" per card.
alter table loyalty_cards add column last_message text;
alter table loyalty_cards add column last_message_at timestamptz;

create table notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  message text not null,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table notification_campaigns enable row level security;

create policy "notification_campaigns: members can read" on notification_campaigns
  for select using (is_merchant_member(merchant_id));

create policy "notification_campaigns: members can insert" on notification_campaigns
  for insert with check (is_merchant_member(merchant_id));
