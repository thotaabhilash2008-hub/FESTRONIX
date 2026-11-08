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
-- authoritative code and name going forward. Handle both a legacy-only
-- database and a database where a CSM row already exists.
do $$
begin
  if exists (select 1 from public.departments where upper(code) = 'CSM')
     and exists (select 1 from public.departments where upper(code) in ('AI&ML', 'AIML')) then
    update public.events set department_code = 'CSM' where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
    update public.admin_roles set department_code = 'CSM' where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
    update public.registrations set department_code = 'CSM' where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
    update public.announcements set department_code = 'CSM' where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
    delete from public.departments where upper(code) in ('AI&ML', 'AIML');
  else
    update public.departments
    set code = 'CSM'
    where upper(code) in ('AI&ML', 'AIML');
    update public.registrations
    set department_code = 'CSM'
    where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
    update public.announcements
    set department_code = 'CSM'
    where upper(coalesce(department_code, '')) in ('AI&ML', 'AIML');
  end if;
end $$;

update public.departments
set name = 'Computer Science & Machine Learning (CSM)',
    description = 'Applied computing, machine learning, computer vision, robotics, and autonomous systems.'
where upper(code) = 'CSM';

commit;
