-- Second brick of Wallet marketing notifications: an automated inactivity /
-- anti-churn engine. This migration only adds the schema and data the engine
-- needs — the actual detection + send logic lives in the
-- /api/cron/inactivity-check route, run daily by Vercel Cron.

-- "Last visit" tracked per card, driven by the existing transactions trigger
-- (every transaction — earn or redeem — corresponds to a staff scan at
-- checkout, i.e. a real visit). Nullable: a brand-new card falls back to its
-- created_at as the reference activity timestamp (see the cron route).
alter table loyalty_cards add column last_visit_at timestamptz;

-- Marks when this card last received an automated inactivity reminder, so the
-- cron doesn't re-notify every single day once a customer crosses the
-- threshold — see the cron route for the exact "one reminder per inactivity
-- episode" comparison this enables.
alter table loyalty_cards add column last_inactivity_notification_at timestamptz;

-- Backfill from existing transaction history so the engine has real data
-- immediately instead of treating every existing customer as freshly
-- inactive-since-signup.
update loyalty_cards lc
set last_visit_at = sub.max_created_at
from (
  select card_id, max(created_at) as max_created_at
  from transactions
  group by card_id
) sub
where lc.id = sub.card_id;

-- Extends the points-balance trigger from 0001_init.sql to also stamp
-- last_visit_at on every transaction — same trigger, same firing conditions,
-- just one more column updated.
create or replace function apply_transaction_to_card()
returns trigger
language plpgsql
as $$
begin
  update loyalty_cards
  set points_balance = points_balance + new.points_delta,
      last_visit_at = new.created_at,
      apple_pass_updated_at = null -- marks the pass as stale; a push/regen job clears this
  where id = new.card_id;
  return new;
end;
$$;

-- Per-program automation settings. Disabled by default — the cron simply
-- skips any program with inactivity_reminder_enabled = false, so shipping
-- this schema doesn't start messaging real customers on its own. The
-- dashboard on/off toggle (Playbooks screen) is a later addition; until then
-- this can be flipped directly in SQL for testing.
alter table loyalty_programs add column inactivity_reminder_enabled boolean not null default false;
alter table loyalty_programs add column inactivity_threshold_days integer not null default 30;
alter table loyalty_programs add column inactivity_message text not null
  default 'On ne vous a pas vu depuis un moment ! Revenez vite pour cumuler des points 🎁';

-- Distinguishes manual broadcasts (Step 1) from automated ones (Step 2+) in
-- the campaign history / future analytics.
alter table notification_campaigns add column type text not null default 'manual'
  check (type in ('manual', 'inactivity'));
