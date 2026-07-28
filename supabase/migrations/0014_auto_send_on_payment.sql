-- Merchant-configurable "send the Wallet card automatically when a POS
-- payment webhook fires" — off by default so an integration going live
-- doesn't start emailing customers until the merchant opts in from
-- /dashboard/settings.
alter table loyalty_programs
  add column auto_send_on_payment_enabled boolean not null default false,
  add column auto_send_channel text not null default 'email'
    check (auto_send_channel in ('email', 'link_only'));
