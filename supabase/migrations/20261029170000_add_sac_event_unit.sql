-- Dean SAC can publish central events, and events.department_code is tied to
-- departments.code. Keep the central unit as a real referenced department.
insert into public.departments (
  code,
  name,
  description,
  chief_coordinator,
  contact,
  icon_name
)
values (
  'SAC',
  'Student Activity Council',
  'Central coordination and oversight for FESTRONIX events.',
  'Dean SAC',
  'sac.festronix@vardhaman.org',
  'Building'
)
on conflict (code) do nothing;
