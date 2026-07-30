-- New merchant signups now require Super Admin approval before reaching
-- their dashboard. approval_status follows the same plain-text +
-- check-constraint convention as billing_status/subscription_plan
-- (migration 0009), not a real Postgres enum.
alter table merchants
  add column approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  add column phone text,
  -- Not in the original ask's migration, but the admin alert email needs a
  -- real "nom du gérant" to show, and the approval route references
  -- merchant.owner_name — added here so both actually work instead of
  -- referencing a column that doesn't exist.
  add column owner_name text;

-- Every merchant that already exists went live before this gate did — they
-- must not suddenly get locked out of their own dashboard by the new
-- default.
update merchants set approval_status = 'approved';

comment on column merchants.approval_status is 'Statut de la demande : pending | approved | rejected';

-- Standardizes the POC length on 30 days as this request specifies. Before
-- this, three different numbers were floating around for the same thing:
-- the DB default (60, migration 0009), lib/billing/plans.ts's
-- POC_DURATION_DAYS constant (60), and the signup page's own copy (a stale
-- "14 jours" that matched neither) — fixed in the same commit as this
-- migration, not left inconsistent.
alter table merchants alter column poc_duration_days set default 30;
