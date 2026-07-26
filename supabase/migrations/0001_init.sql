-- Loyalty SaaS — initial schema
-- Multi-tenant model: one row in `merchants` per tenant, everything else scoped by
-- merchant_id (directly or via a join) and enforced with Row Level Security so a
-- compromised or buggy client can never read/write another merchant's data.

create extension if not exists "pgcrypto";

create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type staff_role as enum ('owner', 'manager', 'staff');
create type transaction_type as enum ('earn', 'redeem', 'adjust');
create type card_status as enum ('active', 'suspended');

-- ─────────────────────────────────────────────────────────────────────────
-- merchants — one per tenant. owner_id is the Supabase auth user who signed up.
-- ─────────────────────────────────────────────────────────────────────────
create table merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  logo_url text,
  brand_color text not null default '#111827',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status subscription_status not null default 'trialing',
  plan text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index merchants_owner_id_idx on merchants (owner_id);

-- staff accounts that can act on behalf of a merchant (scan, credit points) without
-- owning the tenant. Kept separate from `merchants` so ownership stays unambiguous.
create table staff_members (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role staff_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (merchant_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- loyalty_programs — the rules of a merchant's program. Kept separate from
-- `merchants` to allow multiple concurrent programs later (e.g. seasonal campaigns)
-- without a migration.
-- ─────────────────────────────────────────────────────────────────────────
create table loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  name text not null default 'Programme fidélité',
  points_per_euro numeric(10, 2) not null default 1,
  reward_threshold integer not null default 100,
  reward_description text not null default 'Récompense',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index loyalty_programs_merchant_id_idx on loyalty_programs (merchant_id);

-- ─────────────────────────────────────────────────────────────────────────
-- customers — a merchant's end customers. Scoped per merchant: the same person
-- enrolling with two different merchants gets two independent rows, matching the
-- white-label model where each brand owns its own customer relationship.
-- ─────────────────────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (merchant_id, email)
);

create index customers_merchant_id_idx on customers (merchant_id);

-- ─────────────────────────────────────────────────────────────────────────
-- loyalty_cards — one card per customer/program. `serial_number` is the QR code
-- payload scanned in-store and the identifier used in the Apple/Google pass.
-- ─────────────────────────────────────────────────────────────────────────
create table loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  program_id uuid not null references loyalty_programs (id) on delete cascade,
  serial_number text not null unique default encode(gen_random_bytes(12), 'hex'),
  points_balance integer not null default 0,
  status card_status not null default 'active',
  apple_pass_updated_at timestamptz,
  google_object_id text,
  created_at timestamptz not null default now()
);

create index loyalty_cards_merchant_id_idx on loyalty_cards (merchant_id);
create index loyalty_cards_customer_id_idx on loyalty_cards (customer_id);

-- ─────────────────────────────────────────────────────────────────────────
-- transactions — append-only ledger of point movements. points_balance on
-- loyalty_cards is a denormalized cache kept in sync by the trigger below, so
-- dashboard reads stay O(1) instead of summing the ledger every time.
-- ─────────────────────────────────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants (id) on delete cascade,
  card_id uuid not null references loyalty_cards (id) on delete cascade,
  staff_user_id uuid references auth.users (id) on delete set null,
  type transaction_type not null,
  points_delta integer not null,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_card_id_idx on transactions (card_id);
create index transactions_merchant_id_idx on transactions (merchant_id);

-- devices registered for Apple Wallet push updates (PassKit web service spec).
create table apple_wallet_registrations (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references loyalty_cards (id) on delete cascade,
  device_library_identifier text not null,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (card_id, device_library_identifier)
);

-- ─────────────────────────────────────────────────────────────────────────
-- keep loyalty_cards.points_balance in sync with the transactions ledger
-- ─────────────────────────────────────────────────────────────────────────
create function apply_transaction_to_card()
returns trigger
language plpgsql
as $$
begin
  update loyalty_cards
  set points_balance = points_balance + new.points_delta,
      apple_pass_updated_at = null -- marks the pass as stale; a push/regen job clears this
  where id = new.card_id;
  return new;
end;
$$;

create trigger transactions_apply_to_card
  after insert on transactions
  for each row
  execute function apply_transaction_to_card();

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger merchants_set_updated_at
  before update on merchants
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

-- true if the current JWT belongs to the merchant's owner or one of its staff.
create function is_merchant_member(target_merchant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from merchants
    where id = target_merchant_id and owner_id = auth.uid()
  ) or exists (
    select 1 from staff_members
    where merchant_id = target_merchant_id and user_id = auth.uid()
  );
$$;

alter table merchants enable row level security;
alter table staff_members enable row level security;
alter table loyalty_programs enable row level security;
alter table customers enable row level security;
alter table loyalty_cards enable row level security;
alter table transactions enable row level security;
alter table apple_wallet_registrations enable row level security;

create policy "merchants: members can read" on merchants
  for select using (is_merchant_member(id));

create policy "merchants: owner can update" on merchants
  for update using (owner_id = auth.uid());

create policy "merchants: authenticated users can create their own" on merchants
  for insert with check (owner_id = auth.uid());

create policy "staff_members: members can read" on staff_members
  for select using (is_merchant_member(merchant_id));

create policy "staff_members: owner can manage" on staff_members
  for all using (
    exists (select 1 from merchants where id = merchant_id and owner_id = auth.uid())
  );

create policy "loyalty_programs: members can read" on loyalty_programs
  for select using (is_merchant_member(merchant_id));

create policy "loyalty_programs: members can manage" on loyalty_programs
  for all using (is_merchant_member(merchant_id));

create policy "customers: members can read" on customers
  for select using (is_merchant_member(merchant_id));

create policy "customers: members can manage" on customers
  for all using (is_merchant_member(merchant_id));

create policy "loyalty_cards: members can read" on loyalty_cards
  for select using (is_merchant_member(merchant_id));

create policy "loyalty_cards: members can manage" on loyalty_cards
  for all using (is_merchant_member(merchant_id));

create policy "transactions: members can read" on transactions
  for select using (is_merchant_member(merchant_id));

create policy "transactions: members can insert" on transactions
  for insert with check (is_merchant_member(merchant_id));

create policy "apple_wallet_registrations: members can read" on apple_wallet_registrations
  for select using (
    is_merchant_member((select merchant_id from loyalty_cards where id = card_id))
  );

-- Note: public-facing flows (customer enrollment, wallet pass generation, the
-- PassKit device web service, point-of-sale scanning) go through API routes using
-- the Supabase service-role key, which bypasses RLS by design. RLS here protects
-- the dashboard's direct client-side queries — it is not the only access path.
