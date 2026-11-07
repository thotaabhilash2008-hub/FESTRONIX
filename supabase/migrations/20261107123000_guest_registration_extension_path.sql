begin;

-- pgcrypto's byte generator is installed in Supabase's extensions schema.
-- Keep the security-definer functions explicit while allowing them to create
-- delivery tokens at checkout.
alter function private.create_registration(
  uuid, uuid, text, text, text, text, text, text, text, integer, text, text,
  text, text, uuid, jsonb, text, text
) set search_path = pg_catalog, extensions;

alter function private.create_guest_registration(
  uuid, text, text, text, text, text, text, text, integer, text, text, text,
  jsonb, text, text
) set search_path = pg_catalog, extensions;

alter function private.create_guest_registrations(jsonb)
  set search_path = pg_catalog, extensions;

alter function private.expand_team_registration()
  set search_path = pg_catalog, extensions;

commit;
