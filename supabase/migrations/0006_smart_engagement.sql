-- Foundation for Pillar 2 (autonomous, cross-signal activation engine). This
-- migration is deliberately schema-only for signals we don't have a real data
-- source for yet — no fabricated/simulated values are written by application
-- code, ever. Fields with no real source (favorite_category) stay null until
-- an actual POS integration exists to populate them.

-- Where to source weather context from — set once by the merchant in
-- Settings. Nullable: weather-aware arbitration simply skips merchants who
-- haven't set one, same graceful-degradation pattern as every other
-- integration in this app.
alter table merchants add column city text;

-- One row per customer, refreshed daily by /api/cron/compute-purchase-habits
-- from the REAL transactions ledger (timing + amounts) — not simulated.
-- favorite_category has no source yet (would need product-level POS data);
-- left null on purpose rather than invented.
create table customer_purchase_habits (
  customer_id uuid primary key references customers (id) on delete cascade,
  merchant_id uuid not null references merchants (id) on delete cascade,
  preferred_time_of_day text check (preferred_time_of_day in ('morning', 'midday', 'evening')),
  visit_frequency_days numeric,
  avg_points_per_visit numeric,
  favorite_category text,
  updated_at timestamptz not null default now()
);

alter table customer_purchase_habits enable row level security;

create policy "customer_purchase_habits: members can read" on customer_purchase_habits
  for select using (is_merchant_member(merchant_id));

-- Raw landing zone for a future real POS/Stripe product-level webhook — no
-- provider is connected today, so nothing writes here yet and nothing reads
-- from it. Exists so a real integration later has somewhere to land without
-- another migration; payload is opaque jsonb since the real shape depends on
-- whichever provider eventually gets connected.
create table pos_transaction_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  source text not null default 'unknown',
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table pos_transaction_events enable row level security;

create policy "pos_transaction_events: members can read" on pos_transaction_events
  for select using (is_merchant_member(merchant_id));

-- Rule-based arbitration engine ("Copilote Marketing"). Same disabled-by-
-- default safety pattern as inactivity_reminder_enabled — shipping this
-- schema does not start messaging real customers on its own.
alter table loyalty_programs add column smart_engagement_enabled boolean not null default false;

-- Anti-spam guard, mirroring last_inactivity_notification_at: at most one
-- smart-engagement message per card per day.
alter table loyalty_cards add column last_smart_engagement_at timestamptz;

alter table notification_campaigns drop constraint notification_campaigns_type_check;
alter table notification_campaigns add constraint notification_campaigns_type_check
  check (type in ('manual', 'inactivity', 'smart_engagement'));
