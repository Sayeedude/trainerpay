# Role permission matrix

The actual `CREATE POLICY` statements are the source of truth and live in
`database/migrations/0007_rls_core.sql`, `0008_rls_scheduling.sql`, and
`0009_rls_payroll.sql` — kept in the migrations folder (not duplicated here)
so there is exactly one place that can drift from what's deployed. This file
is the human-readable summary for review, per spec section 16.

`R` = read, `W` = write (insert/update/delete), `R(own)` = read restricted to
the caller's own row(s) via `current_employee_id()`.

| Table               | SUPER_ADMIN | PAYROLL_ADMIN | ACADEMIC_MANAGER | TRAINER / EMPLOYEE |
|----------------------|:-----------:|:--------------:|:-----------------:|:--------------------:|
| users                | R/W         | R              | –                 | R(own)               |
| employees            | R/W         | R/W            | R                 | R(own)                |
| pay_rates            | R/W         | R/W            | –                 | R(own), never W       |
| classes              | R           | R              | R/W               | R (whole timetable)   |
| class_allocations    | R           | R              | R/W               | R(own)                 |
| leave                | R/W         | R/W            | R/W (incl. approve) | R(own); can insert own PENDING request, cannot approve |
| cover                | R           | R              | R/W (incl. approve) | R (rows where they are replacement or the covered trainer) |
| payroll_periods      | R/W         | R/W            | R                 | –                      |
| payroll_lines        | R/W         | R/W            | R                 | R(own)                 |
| payroll_exceptions   | R/W         | R/W            | R                 | –                      |
| audit_log            | R           | R              | –                 | –                       |

Key guarantees this enforces (spec section 15):

- **A trainer must never be able to query another trainer's payroll.**
  `payroll_lines_select_self` and `pay_rates_select_self` both filter on
  `employee_id = current_employee_id()`.
- **A trainer must never be able to modify their own rate.** No
  INSERT/UPDATE/DELETE policy exists on `pay_rates` for TRAINER/EMPLOYEE —
  under Postgres RLS, no policy means no access, not open access.
- **A normal employee must never be able to approve payroll.** Only
  `payroll_periods_write_admin` (SUPER_ADMIN/PAYROLL_ADMIN) can write
  `payroll_periods`; ACADEMIC_MANAGER is read-only there.
- **Academic managers don't get unrestricted rate-modify power.** There is
  no ACADEMIC_MANAGER write policy on `pay_rates` at all (spec section 16:
  "Should not have unrestricted ability to modify payroll rates unless
  explicitly granted").
- **The audit log is append-only, even for admins.** There is no
  UPDATE/DELETE policy on `audit_log` for any role, and no direct INSERT
  policy either — rows are written only via the `log_audit_event()`
  `SECURITY DEFINER` function (0006), called from trusted server-side code.

All of the above is enforced at the database layer via Postgres Row Level
Security, not only in application code — so it holds even if a client talks
to Supabase directly with the anon key.
