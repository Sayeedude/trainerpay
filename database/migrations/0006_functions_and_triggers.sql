-- 0006_functions_and_triggers.sql
-- Helper functions used by RLS policies (0007-0009) and by application code.
-- All are SECURITY DEFINER + STABLE where they read `users`, so that RLS on
-- `users` itself does not recurse when these are called from a policy on
-- another table.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_employees_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger trg_classes_updated_at before update on classes
  for each row execute function set_updated_at();
create trigger trg_class_allocations_updated_at before update on class_allocations
  for each row execute function set_updated_at();
create trigger trg_payroll_lines_updated_at before update on payroll_lines
  for each row execute function set_updated_at();

-- The current application user's row, looked up from the Supabase Auth JWT.
create or replace function current_app_user()
returns users
language sql
stable
security definer
set search_path = public
as $$
  select u.* from users u where u.auth_user_id = auth.uid();
$$;

create or replace function current_app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_user_id = auth.uid();
$$;

create or replace function current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from users where auth_user_id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_app_role() in ('SUPER_ADMIN', 'PAYROLL_ADMIN'), false);
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_app_role() = 'SUPER_ADMIN', false);
$$;

create or replace function is_academic_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_app_role() = 'ACADEMIC_MANAGER', false);
$$;

comment on function is_admin() is 'SUPER_ADMIN or PAYROLL_ADMIN — the two roles with payroll-write access (spec section 16).';

-- Append-only audit write helper. SECURITY DEFINER so it can insert into
-- audit_log even though no role has a direct INSERT policy on that table
-- (see 0009_rls_audit.sql) — callers are trusted server-side code paths
-- (API routes / server actions), not arbitrary client queries.
create or replace function log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_value jsonb default null,
  p_new_value jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user_id uuid;
begin
  select id into v_user_id from users where auth_user_id = auth.uid();

  insert into audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
  values (v_user_id, p_action, p_entity_type, p_entity_id, p_old_value, p_new_value)
  returning id into v_id;

  return v_id;
end;
$$;
