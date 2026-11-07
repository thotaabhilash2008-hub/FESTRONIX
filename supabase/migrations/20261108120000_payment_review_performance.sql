-- Keep payment review RPCs from scanning team/payment/audit rows during a
-- locked registration update. This reduces statement-timeout failures when
-- multiple coordinator portals refresh or review the same event concurrently.
create index if not exists payment_proofs_registration_id_idx
  on public.payment_proofs (registration_id);

create index if not exists registrations_event_team_code_coalesced_idx
  on public.registrations (event_id, upper(coalesce(team_code, '')))
  where team_code is not null;

