begin;

-- The public wrapper runs the validated security-definer registration function.
-- Anonymous callers need schema resolution permission, but no direct execute
-- permission on the private implementation.
grant usage on schema private to anon;

commit;
