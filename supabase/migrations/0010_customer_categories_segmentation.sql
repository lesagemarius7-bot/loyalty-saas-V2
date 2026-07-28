-- Segmentation CRM : catégorisation des clients par catégorie d'article
-- achetée + historique des campagnes ciblées.
--
-- last_purchased_category / last_transaction_at rejoignent favorite_category
-- (déjà présent, jamais rempli faute de source réelle — cf. 0006) sur
-- customer_purchase_habits plutôt que sur une nouvelle table "customer_cards"
-- (qui n'existe pas dans ce schéma) : c'est déjà la table d'analytics par
-- client, un seul endroit pour ces trois colonnes évite la duplication.
-- Elles restent honnêtement vides tant qu'aucun événement
-- pos_transaction_events réel (payload->>'category') n'existe pour ce
-- client — pas de catégorie inventée.
alter table customer_purchase_habits
  add column last_purchased_category text,
  add column last_transaction_at timestamptz;

-- 'targeted' = campagne envoyée à un sous-ensemble filtré/sélectionné de
-- clients, distinct de 'manual' (diffusion à tous). target_summary garde une
-- description lisible du segment visé pour l'historique
-- (/dashboard/notifications), ex. "Catégorie : Mobilier" ou
-- "12 client(s) sélectionné(s)".
alter table notification_campaigns drop constraint notification_campaigns_type_check;
alter table notification_campaigns add constraint notification_campaigns_type_check
  check (type in ('manual', 'inactivity', 'smart_engagement', 'targeted'));

alter table notification_campaigns add column target_summary text;
