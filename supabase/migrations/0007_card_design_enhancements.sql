-- Premium visual customization + advanced pass configuration: gradients,
-- banner image, back-of-card practical info, and Wallet geofencing. All
-- columns live on loyalty_programs, next to stamp_icon (0003) — one table
-- already holds every other card-design setting, so this keeps a single
-- source of truth instead of splitting it across a new pass_templates table.
-- Every new column is nullable or has a safe default so existing rows (and
-- the client-side "no program yet" default object) keep working untouched.

alter table loyalty_programs
  add column background_style text not null default 'solid'
    check (background_style in ('solid', 'gradient')),
  add column gradient_secondary_color text not null default '#0f172a',
  add column banner_image_url text,
  add column back_address text,
  add column back_phone text,
  add column back_hours text,
  add column back_instagram_url text,
  add column back_google_review_url text,
  add column back_terms text not null default '1 tampon par passage en caisse.',
  add column latitude double precision,
  add column longitude double precision;
