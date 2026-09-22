-- 0008_rls_scheduling.sql
-- RLS for classes, class_allocations, leave, cover.
--
-- Role summary (spec sections 10, 15-16):
--   SUPER_ADMIN / PAYROLL_ADMIN   full read; write access kept for
--                                  corrections, but day-to-day ownership is
--                                  ACADEMIC_MANAGER's.
--   ACADEMIC_MANAGER              full CRUD — this is their domain
--                                  ("class allocation, trainers, leave,
--                                  cover, hours").
--   TRAINER/EMPLOYEE              read only their own timetable/leave/cover;
--                                  can create their own leave requests, but
--                                  cannot approve them (approved_by/status
--                                  changes require ACADEMIC_MANAGER+).

alter table classes enable row level security;
alter table class_allocations enable row level security;
alter table leave enable row level security;
alter table cover enable row level security;

-- ---------- classes ----------
-- No per-trainer row-level restriction: the timetable itself (which class
-- exists, when) is operational information, not personal payroll data.

create policy classes_select_all on classes
  for select
  using (is_admin() or is_academic_manager() or current_employee_id() is not null);

create policy classes_write_manager on classes
  for all
  using (is_admin() or is_academic_manager())
  with check (is_admin() or is_academic_manager());

-- ---------- class_allocations ----------

create policy class_allocations_select_admin on class_allocations
  for select
  using (is_admin() or is_academic_manager());

create policy class_allocations_select_self on class_allocations
  for select
  using (trainer_employee_id = current_employee_id());

create policy class_allocations_write_manager on class_allocations
  for all
  using (is_admin() or is_academic_manager())
  with check (is_admin() or is_academic_manager());

-- ---------- leave ----------

create policy leave_select_admin on leave
  for select
  using (is_admin() or is_academic_manager());

create policy leave_select_self on leave
  for select
  using (employee_id = current_employee_id());

-- Trainers/employees may submit their own leave requests, always as PENDING
-- with no self-approval fields set.
create policy leave_insert_self on leave
  for insert
  with check (
    employee_id = current_employee_id()
    and status = 'PENDING'
    and approved_by is null
    and approved_at is null
  );

create policy leave_write_manager on leave
  for all
  using (is_admin() or is_academic_manager())
  with check (is_admin() or is_academic_manager());

-- ---------- cover ----------

create policy cover_select_admin on cover
  for select
  using (is_admin() or is_academic_manager());

-- A trainer can see cover rows where they are the replacement (they need to
-- know they're covering someone) or where the underlying allocation is
-- theirs (they need to know they've been covered).
create policy cover_select_self on cover
  for select
  using (
    replacement_employee_id = current_employee_id()
    or exists (
      select 1 from class_allocations ca
      where ca.id = cover.class_allocation_id
        and ca.trainer_employee_id = current_employee_id()
    )
  );

create policy cover_write_manager on cover
  for all
  using (is_admin() or is_academic_manager())
  with check (is_admin() or is_academic_manager());
