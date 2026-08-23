begin;

-- P2-E.2 stores encrypted SMTP credentials inside config_json.
-- The encryption key is server-only; clients only receive redacted integration rows.
comment on column public.organization_integrations.config_json is
  'Server-managed integration configuration. Sensitive SMTP password/key values are encrypted application-side and never returned by the public integration listing.';

commit;
