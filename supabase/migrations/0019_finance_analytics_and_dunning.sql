-- Finance backoffice (unit economics, dunning, POC scoring, exports).
--
-- Deliberately narrower than a naive reading of the feature spec:
--   - No poc_health_score / card_expiring_soon columns. Both are derived
--     from fast-changing signals (stamps scanned, wallet installed, days
--     since last activity; card expiry date vs. today) that would go stale
--     the moment they're cached without a refresh job. lib/analytics/
--     admin-finance.ts computes them live on every read instead — always
--     correct, no extra cron dependency.
--   - No merchant_cost_logs table. The requested margin formula is a single
--     GLOBAL "Marge Brute (%) = (MRR - Coûts Infra Globaux) / MRR", not a
--     per-merchant breakdown, and this schema has no real per-merchant email
--     send count to log anywhere (Resend outcomes aren't persisted — see
--     lib/analytics/admin-overview.ts's emailSuccessRatePct comment). A
--     table that's structurally always missing half its columns is worse
--     than computing the global estimate live from real push-delivery
--     volume (notification_deliveries) plus a documented cost constant.
--
-- dunning_status is real state, not a derived one — it's driven by actual
-- Stripe invoice webhook events (see api/webhooks/stripe) and admin
-- actions, so it genuinely needs to persist between reads.
alter table merchants
  add column dunning_status text not null default 'ok'
    check (dunning_status in ('ok', 'payment_failed', 'retry_1', 'suspended'));

comment on column merchants.dunning_status is 'ok | payment_failed | retry_1 | suspended — driven by Stripe invoice webhooks + admin actions';

-- Real event log for churn/expansion tracking. Neither metric can be
-- computed honestly from a snapshot of merchants' current state alone (you
-- cannot derive "how many churned this month" from only knowing who's
-- churned as of right now) — this table is what makes both metrics real
-- data starting today, instead of a fabricated number. Before this
-- migration ships there is no history, so the finance page shows an honest
-- "no data yet" state until events accumulate.
create table merchant_status_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  event_type text not null check (event_type in ('plan_changed', 'billing_status_changed', 'approval_status_changed')),
  from_value text,
  to_value text not null,
  created_at timestamptz not null default now()
);

create index idx_merchant_status_events_merchant on merchant_status_events(merchant_id, created_at desc);
create index idx_merchant_status_events_type_date on merchant_status_events(event_type, created_at desc);

alter table merchant_status_events enable row level security;

-- Service-role only (same posture as every other /admin/* table this
-- session — see lib/auth/admin-guard.ts's comment on why RLS is never
-- trusted alone for admin authorization here). No policy is added for
-- anon/authenticated roles, so normal merchant sessions get zero rows.
