-- Weather-triggered broadcast campaigns (canicule / pluie-froid).
--
-- Deliberately does NOT add city_name/latitude/longitude to merchants, as a
-- literal reading of the spec would — merchants.city already exists and is
-- already the input to lib/weather/openweather.ts's getWeatherForCity(),
-- used today by /api/cron/smart-engagement. A second "city_name" column
-- would just drift out of sync with the real one. Reuses the SAME city
-- column and the SAME hot/cold/rain condition buckets already defined in
-- classifyCondition() (hot ≥28°C, cold ≤5°C) instead of introducing a
-- parallel 26°C/10°C threshold system that would silently disagree with the
-- existing one for the same weather.
alter table merchants add column weather_trigger_enabled boolean not null default false;

comment on column merchants.weather_trigger_enabled is 'Opts into automatic broadcast campaigns (canicule/pluie-froid) from /api/cron/daily — distinct from the existing per-customer weather-flavored nudge in smart-engagement, which never mass-broadcasts.';

create table weather_campaign_logs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  condition_type text not null check (condition_type in ('hot', 'cold', 'rain')),
  temperature_celsius numeric(4, 1),
  message_sent text not null,
  delivered_count int not null default 0,
  triggered_at timestamptz not null default now()
);

create index idx_weather_campaign_logs_merchant on weather_campaign_logs(merchant_id, triggered_at desc);

alter table weather_campaign_logs enable row level security;

create policy "weather_campaign_logs: members can read" on weather_campaign_logs
  for select using (is_merchant_member(merchant_id));

-- New broadcast type, alongside the existing manual/inactivity/
-- smart_engagement/targeted set from migration 0010 — a weather broadcast
-- goes through the exact same deliverToCards() + notification_campaigns
-- history as every other campaign type, just with its own label.
alter table notification_campaigns drop constraint notification_campaigns_type_check;
alter table notification_campaigns add constraint notification_campaigns_type_check
  check (type in ('manual', 'inactivity', 'smart_engagement', 'targeted', 'weather'));
