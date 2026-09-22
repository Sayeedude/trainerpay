# Seed data

No real employee, rate, or class data is seeded by Phase 1. The spec is
explicit: **do not invent missing information**, and the real data (from
`Trainer_Timesheet_1.xlsx` and the written spec) gets imported deliberately
in **Phase 2**, with discrepancies turned into `payroll_exceptions` rows
rather than silently resolved.

What *will* go in this folder in Phase 2:

- `01_employees.sql` (or an import script) — the current employee list,
  including Travis Jenkins with no rate (an exception, not a guess).
- `02_pay_rates.sql` — current rates from the `Trainer Pay Rates` sheet.
- A note on `payroll_periods` for the current period, 2026-09-07 to
  2026-09-20 (spec section 3).

If you need *some* data to click through the Phase 1 auth/RLS setup before
Phase 2 lands, create one throwaway test user by hand in the Supabase
dashboard rather than adding fixtures here — keep this folder free of
anything that isn't real, sourced data.
