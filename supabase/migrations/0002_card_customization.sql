-- Adds a text/foreground color alongside the existing brand_color (used as the
-- card's background), so the card design screen can guarantee readable contrast
-- instead of assuming white text works on every brand color.

alter table merchants add column card_text_color text not null default '#ffffff';
