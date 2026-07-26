-- Demo data for local development. Run automatically by `supabase db reset`.
-- Requires a matching auth.users row — create one first via the Supabase Studio
-- auth UI (http://localhost:54323) or `supabase auth` and paste its id below.

-- example (uncomment and replace the uuid after creating a local test user):
-- insert into merchants (owner_id, business_name, slug, brand_color)
-- values ('00000000-0000-0000-0000-000000000000', 'Le Café des Arts', 'cafe-des-arts', '#7c3aed')
-- returning id;

-- insert into loyalty_programs (merchant_id, name, points_per_euro, reward_threshold, reward_description)
-- values ('<merchant id from above>', 'Programme fidélité', 1, 100, 'Un café offert');
