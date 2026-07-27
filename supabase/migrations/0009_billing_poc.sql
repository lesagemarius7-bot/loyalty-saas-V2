-- POC (2-month free trial) tracking + the plan the merchant intends to move to
-- once it ends. billing_status is tracked separately from merchants.subscription_status
-- (which mirrors raw Stripe webhook state) because it needs a POC-aware value
-- ('poc_active') that predates any real Stripe subscription — the webhook
-- handler is updated to also advance billing_status once real billing starts.
alter table merchants
  add column poc_start_date timestamptz not null default now(),
  add column poc_duration_days integer not null default 60,
  add column subscription_plan text not null default 'performance_ia'
    check (subscription_plan in ('essentiel', 'performance_ia')),
  add column billing_status text not null default 'poc_active'
    check (billing_status in ('poc_active', 'active', 'past_due', 'canceled'));
