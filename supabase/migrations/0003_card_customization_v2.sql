-- Stamp icon shown in the filled dots of the loyalty-progress grid (✓, ☕, 🍕…).
alter table loyalty_programs add column stamp_icon text not null default '✓';

-- ─────────────────────────────────────────────────────────────────────────
-- Logo uploads (dashboard card-design page). Public bucket — logos are shown on
-- a public enrollment/card page anyway — but writes are restricted to the
-- authenticated owner, scoped by a {auth.uid()}/... path prefix.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos: public read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos: owner can upload" on storage.objects
  for insert with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos: owner can update" on storage.objects
  for update using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos: owner can delete" on storage.objects
  for delete using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────
-- card_preview_sessions — one draft row per merchant, holding the card-design
-- form's current (possibly unsaved) values. Exists so the "scan to test on your
-- phone" QR code on /dashboard/card-design can point at a URL the phone can load
-- with no session cookie (it's a different device/browser than the dashboard),
-- while still reflecting live edits. Read by merchant_id from the wallet preview
-- routes via the service-role client (capability-based access, same trust model
-- as the existing cardId-based wallet routes) — this table only needs RLS for the
-- authenticated dashboard writing to it.
-- ─────────────────────────────────────────────────────────────────────────
create table card_preview_sessions (
  merchant_id uuid primary key references merchants (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table card_preview_sessions enable row level security;

create policy "card_preview_sessions: members can manage" on card_preview_sessions
  for all using (is_merchant_member(merchant_id));
