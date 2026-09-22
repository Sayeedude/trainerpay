# Phase 1 — what's actually here

Per the build spec's phased approach (section 25) and the instruction not
to build the whole application in one pass, this is **Phase 1 only**:
project scaffold, Supabase connection, authentication, database schema,
RLS, and the role system. Nothing else.

## What's implemented

- **Next.js 16 / TypeScript / Tailwind project**, structured per the
  spec's repo layout (section 24).
- **Full database schema** for all 11 tables from spec section 14
  (`database/migrations/0001`–`0005`), including the `raw_hours` /
  `payroll_hours` / `hours_source` split that prevents the already-
  multiplied-import bug described in spec section 7.
- **Row Level Security** on every table (`0007`–`0009`), enforcing the
  guarantees in spec section 15 (a trainer can't read another trainer's
  payroll or rate; a trainer can never write their own rate; only
  SUPER_ADMIN/PAYROLL_ADMIN can approve/finalise payroll) at the database
  layer, not just in application code. See
  `database/policies/role_permission_matrix.md` for the full breakdown.
- **Supabase Auth**, wired through `@supabase/ssr` for both the browser
  and the server (`lib/supabase/client.ts`, `server.ts`, `admin.ts`), plus
  `proxy.ts` (Next.js 16's renamed `middleware.ts`) for session refresh
  and redirecting signed-out requests to `/login`.
- **The 5-role system** from spec section 16 (`lib/permissions/roles.ts`),
  used to filter the sidebar nav and gate the one example admin action
  (`POST /api/admin/users`, provisioning a new login).
- **A working, if mostly empty, app shell**: `/login` works end-to-end
  against a real Supabase project; `/dashboard` shows who you're signed in
  as and what your role can do; the other six nav sections
  (`/employees`, `/allocation`, `/hours`, `/payroll`, `/reports`,
  `/settings`) are reachable (or hidden, per role) but show a "coming in
  Phase N" placeholder rather than fake data.
- **Automated tests** (`npm test`): the role/permission matrix
  (`tests/permissions/roles.test.ts`) and static checks that every
  required table exists with RLS enabled, and that the specific security
  guarantees above actually hold in the migration SQL
  (`tests/permissions/schema-and-rls-coverage.test.ts`).

## What's deliberately NOT here yet

- No employee, rate, class, or payroll data — `database/seed/` explains
  why (spec: don't invent missing information).
- No timetable/calendar UI (Phase 3).
- No payroll calculation engine (Phase 4) — `lib/payroll/` is an empty
  placeholder with a README explaining what goes there.
- No reports/export/audit-log UI (Phase 5) — the `audit_log` table and
  `logAuditEvent()` helper exist and work, but nothing renders the log
  yet.

## Before moving to Phase 2

1. Create a Supabase project and run the migrations (`database/README.md`).
2. Create one SUPER_ADMIN user by hand (main `README.md`, step 5) and
   confirm you can log in, land on `/dashboard`, and see the correct role
   and nav.
3. Run `npm run typecheck`, `npm run lint`, and `npm test` — all should
   pass clean.
4. Push to GitHub.

Phase 2 (employees, rates, contracts, active/inactive) is what actually
imports the real data from `Trainer_Timesheet_1.xlsx` — including turning
Travis Jenkins' missing rate, Andrew Shaw's sick-leave/timetable conflict,
and the several contract-hours-vs-actual gaps in `Pay Rule Reference` /
`Trainer Pay Rates` into `payroll_exceptions` rows instead of resolving
them silently.
