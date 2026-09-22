# Database

PostgreSQL schema and Row Level Security policies for TrainerPay, designed
to run on Supabase. See `../PHASE1_NOTES.md` for what's in scope right now.

## Layout

- `migrations/` — the deployable, ordered schema. Applied in filename
  order. This is the single source of truth for both table structure and
  RLS policies.
- `policies/role_permission_matrix.md` — human-readable summary of the RLS
  policies defined in `migrations/0007`–`0009`, for review. Not applied
  directly.
- `seed/` — intentionally empty of real data until Phase 2. See its README.

## Applying the migrations

Once you have a Supabase project (`Supabase setup` in the main README):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`supabase db push` applies every `.sql` file under `database/migrations/`
that hasn't been applied yet, in filename order — that's why they're
zero-padded (`0001_`, `0002_`, …). Don't renumber an already-applied file;
add a new one instead.

Alternatively, for a first-time setup on a brand new project, you can paste
the files in order into the Supabase SQL editor.

## What's here (Phase 1)

| File | Contents |
|---|---|
| `0001_extensions_and_enums.sql` | `pgcrypto` extension, all enum types |
| `0002_core_tables.sql` | `employees`, `users`, `pay_rates` |
| `0003_scheduling_tables.sql` | `classes`, `class_allocations`, `leave`, `cover` |
| `0004_payroll_tables.sql` | `payroll_periods`, `payroll_lines`, `payroll_exceptions` |
| `0005_audit_log.sql` | `audit_log` |
| `0006_functions_and_triggers.sql` | `updated_at` triggers, role-lookup helpers, `log_audit_event()` |
| `0007_rls_core.sql` | RLS for `users`, `employees`, `pay_rates` |
| `0008_rls_scheduling.sql` | RLS for `classes`, `class_allocations`, `leave`, `cover` |
| `0009_rls_payroll.sql` | RLS for `payroll_periods`, `payroll_lines`, `payroll_exceptions`, `audit_log` |

Notable design decisions, and why:

- **`raw_hours` vs `payroll_hours` are different columns on different
  tables** (`classes.raw_hours` vs `class_allocations.payroll_hours`), with
  an explicit `hours_source` enum (`CALCULATED` | `IMPORTED_FINAL`) on the
  allocation row. This is the mechanism spec section 7 asks for so the
  payroll engine (Phase 4) never re-multiplies an already-multiplied
  import.
- **`pay_rates` is append-only by convention** (enforced by a partial
  unique index ensuring only one "current" row per employee, plus the app
  layer always inserting a new row rather than updating). Historical
  payroll must keep using the historical rate (spec section 14/19).
- **RLS is the enforcement layer for the security rules in spec section
  15**, not just application code — see
  `policies/role_permission_matrix.md` for exactly which guarantee maps to
  which policy.
- **`audit_log` has no write policy for any role.** Writes only happen
  through the `SECURITY DEFINER` function `log_audit_event()`, so the log
  can't be edited or deleted even by an admin through the normal API.
