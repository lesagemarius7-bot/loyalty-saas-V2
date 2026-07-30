-- Technical system logs + POC lifecycle reminder tracking.
--
-- Directly closes a gap the admin backoffice already documents out loud:
-- (admin)/admin/(protected)/logs/page.tsx has shipped an amber banner since
-- migration 0012 admitting "email sends and raw webhook events aren't
-- persisted anywhere" — this table is what makes that banner obsolete
-- instead of leaving it as a permanent disclaimer.
create table system_logs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  level text not null default 'info' check (level in ('info', 'warning', 'error', 'critical')),
  category text not null check (category in ('apns', 'google_wallet', 'resend', 'stripe', 'cron', 'webhook')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_system_logs_level on system_logs(level);
create index idx_system_logs_created_at on system_logs(created_at desc);
create index idx_system_logs_category on system_logs(category);

alter table system_logs enable row level security;

-- Service-role only, same posture as merchant_status_events (migration
-- 0019) — no anon/authenticated policy, so a merchant session gets zero
-- rows regardless of merchant_id.

-- Two columns, not the spec's single poc_reminder_sent_at: the J-7 and J-3
-- reminders are two independent milestones that both need their own
-- idempotency flag. A single timestamp can't tell "already sent the J-7
-- one" apart from "already sent the J-3 one" — it would either double-fire
-- or skip one of the two.
alter table merchants
  add column poc_reminder_7d_sent_at timestamptz,
  add column poc_reminder_3d_sent_at timestamptz;

comment on column merchants.poc_reminder_7d_sent_at is 'Set once the J-7 POC-expiry reminder email has been sent — prevents duplicate sends across cron runs.';
comment on column merchants.poc_reminder_3d_sent_at is 'Set once the J-3 POC-expiry reminder email has been sent — prevents duplicate sends across cron runs.';
