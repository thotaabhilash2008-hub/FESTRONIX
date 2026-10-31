-- Date-only event deadlines have historically been serialized as midnight
-- timestamps. Treat those values as the end of their calendar date so the UI
-- and registration RPC agree throughout the stated deadline day.
with date_only_deadlines as (
  select
    e.id,
    case
      -- ISO date inputs were previously parsed as UTC midnight.
      when (e.deadline at time zone 'UTC')::time = time '00:00:00' then
        (((e.deadline at time zone 'UTC')::date + 1)::timestamp - interval '1 millisecond')
          at time zone 'Asia/Kolkata'
      -- Human-readable date strings were previously parsed at local midnight.
      else
        (((e.deadline at time zone 'Asia/Kolkata')::date + 1)::timestamp - interval '1 millisecond')
          at time zone 'Asia/Kolkata'
    end as normalized_deadline
  from public.events e
  where e.deadline is not null
    and (
      (e.deadline at time zone 'UTC')::time = time '00:00:00'
      or (e.deadline at time zone 'Asia/Kolkata')::time = time '00:00:00'
    )
)
update public.events e
set deadline = d.normalized_deadline,
    updated_at = now()
from date_only_deadlines d
where e.id = d.id;
