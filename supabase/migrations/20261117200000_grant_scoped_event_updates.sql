-- Authenticated admin and department coordinator clients save event edits
-- directly through PostgREST. The RLS policy and event guard continue to
-- enforce which event rows and fields each account may change.
begin;

grant update (
  slug,
  title,
  tagline,
  department_code,
  cluster_code,
  category,
  format,
  min_team_size,
  max_team_size,
  fee,
  capacity,
  deadline,
  date_display,
  time_display,
  venue,
  description,
  rules,
  prizes,
  eligibility,
  coordinator_name,
  coordinator_phone,
  coordinator_email,
  status,
  banner_gradient,
  payment_instructions,
  whatsapp_group_link,
  faqs,
  approval_status,
  updated_at
) on table public.events to authenticated;

commit;
