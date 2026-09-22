-- 0007_rls_core.sql
-- RLS for users, employees, pay_rates.
--
-- Role summary this enforces (spec sections 15-16):
--   SUPER_ADMIN       full access to everything in this file.
--   PAYROLL_ADMIN     full access to employees and pay_rates; can read all users.
--   ACADEMIC_MANAGER  can read employees (needed for allocation/leave/cover);
--                      no access to pay_rates (not granted rate visibility
--                      by the spec — "should not have unrestricted ability
--                      to modify payroll rates unless explicitly granted").
--   TRAINER/EMPLOYEE  can read/update only their own employee row (limited
--                      fields — see note below); can read only their own
--                      current pay_rates row, and can never write it.
--                      "A trainer must never be able to modify their own
--                      rate" (spec section 15).
--
-- Note: fine-grained column-level restriction (e.g. a trainer editing their
-- phone number but not their employment_type) is left to the application
-- layer / a view in a later phase; Phase 1 RLS controls row visibility and
-- whole-row write access only.

alter table users enable row level security;
alter table employees enable row level security;
alter table pay_rates enable row level security;

-- ---------- users ----------

create policy users_select_self on users
  for select
  using (auth_user_id = auth.uid());

create policy users_select_admin on users
  for select
  using (is_admin());

create policy users_insert_admin on users
  for insert
  with check (is_super_admin());

create policy users_update_admin on users
  for update
  using (is_super_admin())
  with check (is_super_admin());

create policy users_delete_admin on users
  for delete
  using (is_super_admin());

-- ---------- employees ----------

create policy employees_select_admin on employees
  for select
  using (is_admin() or is_academic_manager());

create policy employees_select_self on employees
  for select
  using (id = current_employee_id());

create policy employees_write_admin on employees
  for all
  using (is_admin())
  with check (is_admin());

-- ---------- pay_rates ----------
-- Deliberately no INSERT/UPDATE/DELETE policy for TRAINER/EMPLOYEE at all —
-- omitting a write policy denies it by default under RLS.

create policy pay_rates_select_admin on pay_rates
  for select
  using (is_admin());

create policy pay_rates_select_self on pay_rates
  for select
  using (employee_id = current_employee_id());

create policy pay_rates_write_admin on pay_rates
  for all
  using (is_admin())
  with check (is_admin());
