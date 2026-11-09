-- Canonicalise the department role and department catalog names used by the
-- production portals. Legacy role/code values are accepted by the app for
-- backward compatibility, but are migrated to the canonical values here.

begin;

update public.admin_roles
set role = 'dept_coordinator',
    designation = case
      when designation is null or btrim(designation) = '' then 'Department Coordinator'
      else regexp_replace(
        regexp_replace(designation, 'Department Chief Coordinator', 'Department Coordinator', 'gi'),
        '\mHOD\M', 'Department Coordinator', 'gi'
      )
    end,
    updated_at = now()
where role = 'dept_chief_coordinator';

-- The department was previously displayed as AI&ML/AIML. CSM is the
-- authoritative code and name going forward. CSD is a separate department
-- and must remain available in the catalog.
do $$
declare
  v_csm_id uuid;
begin
  if not exists (select 1 from public.departments where upper(code) = 'CSM') then
    insert into public.departments (code, name, description, chief_coordinator, contact, icon_name)
    values (
      'CSM',
      'Computer Science & Machine Learning (CSM)',
      'Applied computing, machine learning, computer vision, robotics, and autonomous systems.',
      'Dr. V. Prasad',
      'csm.festronix@vardhaman.org',
      'Brain'
    );
  end if;

  if not exists (select 1 from public.departments where upper(code) = 'CSD') then
    insert into public.departments (code, name, description, chief_coordinator, contact, icon_name)
    values (
      'CSD',
      'Computer Science & Data Science (CSD)',
      'Big data pipelines, statistical predictive modeling, data visualization, and intelligence systems.',
      'Dr. S. Radhika',
      'csd.festronix@vardhaman.org',
      'Database'
    );
  end if;

  select id into v_csm_id from public.departments where upper(code) = 'CSM' limit 1;
  update public.events
  set department_code = 'CSM', department_id = v_csm_id
  where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
  update public.admin_roles set department_code = 'CSM'
  where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
  update public.registrations set department_code = 'CSM'
  where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
  update public.announcements set department_code = 'CSM'
  where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
  delete from public.departments where upper(code) in ('AI&ML', 'AIML');
end $$;

update public.departments
set name = 'Computer Science & Machine Learning (CSM)',
    description = 'Applied computing, machine learning, computer vision, robotics, and autonomous systems.'
where upper(code) = 'CSM';

commit;
