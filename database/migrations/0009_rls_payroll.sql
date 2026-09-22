-- 0009_rls_payroll.sql
-- RLS for payroll_periods, payroll_lines, payroll_exceptions, audit_log.
--
-- Role summary (spec sections 15-16):
--   SUPER_ADMIN / PAYROLL_ADMIN   full access — payroll is their domain.
--   ACADEMIC_MANAGER              read-only visibility ("view
--                                  payroll-relevant information"); no
--                                  ability to approve payroll.
--   TRAINER/EMPLOYEE              can read only their own payroll_lines
--                                  rows ("own payroll information"); no
--                                  access to other employees' lines, to
--                                  payroll_periods, or to exceptions.
--   audit_log                     read-only for SUPER_ADMIN/PAYROLL_ADMIN.
--                                  No INSERT/UPDATE/DELETE policy exists
--                                  for ANY role — writes happen only
--                                  through log_audit_event() (0006), which
--                                  is SECURITY DEFINER and so bypasses RLS.
--                                  This makes the log append-only and
--                                  tamper-resistant even for admins.

alter table payroll_periods enable row level security;
alter table payroll_lines enable row level security;
alter table payroll_exceptions enable row level security;
alter table audit_log enable row level security;

-- ---------- payroll_periods ----------

create policy payroll_periods_select_admin on payroll_periods
  for select
  using (is_admin() or is_academic_manager());

create policy payroll_periods_write_admin on payroll_periods
  for all
  using (is_admin())
  with check (is_admin());

-- ---------- payroll_lines ----------
-- A trainer must never be able to query another trainer's payroll
-- (spec section 15) — enforced by employee_id = current_employee_id().

create policy payroll_lines_select_admin on payroll_lines
  for select
  using (is_admin() or is_academic_manager());

create policy payroll_lines_select_self on payroll_lines
  for select
  using (employee_id = current_employee_id());

create policy payroll_lines_write_admin on payroll_lines
  for all
  using (is_admin())
  with check (is_admin());

-- ---------- payroll_exceptions ----------

create policy payroll_exceptions_select_admin on payroll_exceptions
  for select
  using (is_admin() or is_academic_manager());

create policy payroll_exceptions_write_admin on payroll_exceptions
  for all
  using (is_admin())
  with check (is_admin());

-- ---------- audit_log ----------
-- Read-only for admins. Deliberately no write policy for any role.

create policy audit_log_select_admin on audit_log
  for select
  using (is_admin());
