-- Powers the "Chiffre d'affaires stimulé (estimé)" KPI on /dashboard: nullable
-- and merchant-configurable rather than guessed, since there is no real POS
-- integration to derive a real average basket from (same honesty stance as
-- customer_purchase_habits.favorite_category in 0006). The KPI shows a guided
-- "configure this" state instead of a fabricated number until it's set.
alter table merchants add column avg_basket_value numeric;
