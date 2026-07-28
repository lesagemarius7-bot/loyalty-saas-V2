-- Per-merchant API key, used to authenticate POS/accounting webhook sync
-- (POST /api/webhooks/customers/sync) — distinct from the single shared
-- POS_WEBHOOK_SECRET (0006), which only proves "a request came from some
-- configured POS", not which merchant it belongs to. gen_random_bytes is
-- already used for loyalty_cards.serial_number (0001), same pgcrypto
-- extension, no new dependency.
alter table merchants add column api_key text unique;
update merchants set api_key = encode(gen_random_bytes(32), 'hex') where api_key is null;
alter table merchants alter column api_key set default encode(gen_random_bytes(32), 'hex');
alter table merchants alter column api_key set not null;
