begin;

-- Public pass lookup for the account-free registration flow.
-- The public site never receives a table-wide registrations read. A caller
-- must provide an exact registration ID, email, roll number, or team code.
-- Sensitive payment proof paths and inactive QR tokens are intentionally not
-- returned by this function.
create or replace function public.lookup_public_passes(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
  v_normalized text := regexp_replace(upper(trim(coalesce(p_query, ''))), '[^A-Z0-9]', '', 'g');
begin
  if length(v_query) < 3 then
    return jsonb_build_object(
      'success', false,
      'error', 'Enter at least 3 characters from your registration ID, roll number, email, or team code.',
      'registrations', '[]'::jsonb
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'registrations', coalesce((
      select jsonb_agg(result_row.payload order by result_row.created_at desc)
      from (
        select
          r.created_at,
          jsonb_build_object(
            'id', r.display_id,
            'userId', r.user_id,
            'buyerRoll', r.buyer_roll,
            'eventId', r.event_id,
            'eventTitle', r.event_title,
            'teamName', r.team_name,
            'teamCode', r.team_code,
            'leaderName', r.leader_name,
            'leaderEmail', r.leader_email,
            'leaderPhone', r.leader_phone,
            'leaderCollege', r.leader_college,
            'leaderRoll', r.leader_roll,
            'teammates', coalesce((
              select jsonb_agg(jsonb_build_object(
                'name', m.name,
                'email', m.email,
                'phone', m.phone,
                'college', m.college,
                'rollNumber', m.roll_number,
                'registrationStatus', coalesce(member_reg.payment_status, 'membership_pending'),
                'qrGenerated', case when member_reg.id is null then false else exists (
                  select 1 from public.tickets member_ticket
                  where member_ticket.registration_id = member_reg.id
                    and nullif(trim(coalesce(member_ticket.qr_token, '')), '') is not null
                    and member_reg.payment_status in ('verified', 'not_applicable')
                ) end,
                'registeredAt', member_reg.created_at
              ) order by m.created_at)
              from public.registration_members m
              left join lateral (
                select mr.id, mr.payment_status, mr.created_at
                from public.registrations mr
                where mr.event_id = r.event_id
                  and upper(coalesce(mr.leader_roll, '')) = upper(coalesce(m.roll_number, ''))
                  and regexp_replace(upper(coalesce(mr.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g')
                order by mr.created_at desc
                limit 1
              ) member_reg on true
              where m.registration_id = r.id
            ), '[]'::jsonb),
            'format', r.format,
            'fee', r.fee,
            'source', r.source,
            'registrationDate', r.created_at,
            'paymentStatus', r.payment_status,
            'paymentMethod', null,
            'transactionId', r.transaction_id,
            'rejectionReason', r.rejection_reason,
            'verifiedBy', r.verified_by,
            'verifiedAt', r.verified_at,
            'qrToken', case when r.payment_status in ('verified', 'not_applicable') then t.qr_token else null end,
            'checkedIn', coalesce(t.checked_in, false),
            'checkedInAt', t.checked_in_at,
            'checkedInBy', t.checked_in_by,
            'departmentCode', e.department_code
          ) as payload
        from public.registrations r
        join public.events e on e.id = r.event_id
        left join public.tickets t on t.registration_id = r.id
        where upper(r.display_id) = upper(v_query)
           or lower(trim(coalesce(r.leader_email, ''))) = lower(v_query)
           or upper(trim(coalesce(r.leader_roll, ''))) = upper(v_query)
           or regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_normalized
           or exists (
                select 1
                from public.registration_members query_member
                where query_member.registration_id = r.id
                  and (
                    lower(trim(coalesce(query_member.email, ''))) = lower(v_query)
                    or upper(trim(coalesce(query_member.roll_number, ''))) = upper(v_query)
                  )
              )
      ) result_row
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.lookup_public_passes(text) from public, anon, authenticated;
grant execute on function public.lookup_public_passes(text) to anon, authenticated;

commit;
