begin;

-- The public pass lookup already returns only exact, privacy-safe matches.
-- This wrapper adds the ticket token for every matched registration, including
-- payment_required and verification_pending states. Payment remains visible as
-- status information, but it is no longer used as a QR visibility gate.
create or replace function public.lookup_public_passes_unlocked(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  v_result jsonb := public.lookup_public_passes(p_query);
  v_registrations jsonb;
begin
  if coalesce((v_result->>'success')::boolean, false) = false then
    return v_result;
  end if;

  select coalesce(jsonb_agg(
    jsonb_set(
      item.value,
      '{qrToken}',
      to_jsonb(coalesce(ticket.qr_token, ''::text)),
      true
    )
  ), '[]'::jsonb)
  into v_registrations
  from jsonb_array_elements(coalesce(v_result->'registrations', '[]'::jsonb)) item
  left join public.registrations registration
    on registration.display_id = item.value->>'id'
  left join public.tickets ticket
    on ticket.registration_id = registration.id;

  return jsonb_set(v_result, '{registrations}', v_registrations, true);
end;
$$;

revoke all on function public.lookup_public_passes_unlocked(text) from public, anon, authenticated;
grant execute on function public.lookup_public_passes_unlocked(text) to anon, authenticated;

commit;
