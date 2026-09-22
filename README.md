# TrainerPay

Secure HR, class allocation, and fortnightly payroll for Jazz Music
Institute. Next.js (App Router) + TypeScript + Supabase (Postgres, Auth,
Row Level Security) + Tailwind CSS.

Built in phases — see `PHASE1_NOTES.md` for what's actually implemented
right now vs. what's coming. Short version: **Phase 1 (this state) is auth,
schema, and RLS. There is no employee data, no timetable, and no payroll
calculation yet** — those are Phases 2–4.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) if you don't have
one yet. From Project Settings → API, you'll need:

- the project URL
- the `anon` public key
- the `service_role` secret key (server-only — never expose this)

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the three Supabase values from step 2.

### 4. Apply the database schema

See `database/README.md` for the full instructions. Short version:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates all tables, enums, helper functions, and RLS policies from
`database/migrations/`.

### 5. Create your first user

Phase 1 has no employee data yet, so create one SUPER_ADMIN by hand to get
in:

1. In the Supabase dashboard, Authentication → Users → **Add user**, and
   set a password (or send a magic link).
2. In the SQL editor, link that auth user to a `users` row:

   ```sql
   insert into users (auth_user_id, email, role)
   values ('<the auth user''s UUID from step 1>', '<their email>', 'SUPER_ADMIN');
   ```

Later, once you're signed in as a SUPER_ADMIN, `POST /api/admin/users`
provisions further logins.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected
to `/login`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

## Repository structure

```text
trainerpay/
├── app/                 # Next.js App Router routes
│   ├── dashboard/       # Phase 1: live. Others: stubs until their phase lands.
│   ├── employees/
│   ├── allocation/
│   ├── hours/
│   ├── payroll/
│   ├── reports/
│   ├── settings/
│   ├── login/           # Phase 1: live
│   └── api/
├── components/
│   ├── ui/               # AppShell, nav, shared bits — Phase 1
│   ├── payroll/          # Empty until Phase 4
│   ├── allocation/       # Empty until Phase 3
│   ├── employees/        # Empty until Phase 2
│   └── dashboard/        # Empty until Phase 4's real dashboard
├── lib/
│   ├── supabase/         # Client/server/admin/middleware helpers — Phase 1
│   ├── payroll/          # calculatePayroll() — Phase 4
│   ├── permissions/       # Role system + current-user resolution — Phase 1
│   ├── validation/        # Zod schemas
│   └── audit/             # logAuditEvent() wrapper — Phase 1
├── database/
│   ├── migrations/        # Deployable schema + RLS — Phase 1
│   ├── seed/               # Empty until Phase 2 (real data only, no fixtures)
│   └── policies/           # Human-readable RLS review doc
├── tests/
│   ├── payroll/            # Empty until Phase 4
│   ├── allocation/          # Empty until Phase 3
│   └── permissions/         # Role + RLS-coverage tests — Phase 1
├── public/
├── proxy.ts                 # Session refresh + route protection (Next.js 16's renamed middleware.ts)
├── .env.example
└── PHASE1_NOTES.md
```

## Security notes

- **RLS is the real enforcement layer**, not application code — see
  `database/policies/role_permission_matrix.md`. Every table with
  sensitive data has Row Level Security enabled and policies scoped by
  role and, where relevant, by `current_employee_id()`.
- The Supabase **service role key is only ever imported from
  `lib/supabase/admin.ts`**, which is marked `server-only` — importing it
  from client code fails the build rather than leaking the key at
  runtime.
- `audit_log` has **no write policy for any role** — rows are written only
  through the `log_audit_event()` `SECURITY DEFINER` function, so the log
  can't be edited or deleted, even by an admin, through the normal API.
