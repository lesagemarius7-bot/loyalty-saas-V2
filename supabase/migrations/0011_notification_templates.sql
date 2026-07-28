-- Reusable notification templates (title + body, with {{variable}} tags) a
-- merchant can save and reuse from the notification composer.
create table notification_templates (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  title_template text not null,
  body_template text not null,
  category_target text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notification_templates_merchant on notification_templates(merchant_id);

create trigger notification_templates_set_updated_at
  before update on notification_templates
  for each row
  execute function set_updated_at();

alter table notification_templates enable row level security;

create policy "notification_templates: members can read" on notification_templates
  for select using (is_merchant_member(merchant_id));

create policy "notification_templates: members can manage" on notification_templates
  for all using (is_merchant_member(merchant_id)) with check (is_merchant_member(merchant_id));
