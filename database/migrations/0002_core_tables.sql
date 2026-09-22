-- 0002_core_tables.sql
-- users, employees, pay_rates (spec section 14).

create table employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text unique,
  employment_type employment_type not null,
  role text,                        -- free-text job title, e.g. 'Teacher', 'Admin', 'Business Analyst'
  classification text,              -- e.g. 'A.8' — hourly teachers only; nullable for salaried staff
  active boolean not null default true,
  start_date date,
  end_date date,
  ordinary_hours_per_week numeric(5,2),
  salary numeric(12,2),             -- annualised salary; salaried employment types only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_end_after_start check (end_date is null or start_date is null or end_date >= start_date),
  -- A former employee must be inactive. See spec section 4/6.
  constraint employees_former_is_inactive check (employment_type <> 'FORMER' or active = false)
);

comment on table employees is 'Every person who has ever taught or worked at the business. Former employees stay here (active=false) for history — never deleted, never included in active payroll.';
comment on column employees.classification is 'Award classification (e.g. A.1–A.8). Drives the current pay_rates row for hourly teachers.';

-- users links a Supabase Auth identity to an application role and, where
-- applicable, an employee record. Not every user has an employee_id (e.g.
-- a SUPER_ADMIN who is not on payroll), and not every employee has a user
-- (a former employee with no login).
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique,
  role user_role not null default 'EMPLOYEE',
  employee_id uuid references employees (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table users is 'Application identity + role for each login. auth_user_id is the Supabase Auth user; role drives RLS and app-level permissions.';

-- Historical pay rates. A rate change never overwrites history — see spec
-- section 14 ("Never overwrite historical rates").
create table pay_rates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id),
  classification text,
  hourly_rate numeric(8,2) not null check (hourly_rate >= 0),
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  constraint pay_rates_to_after_from check (effective_to is null or effective_to >= effective_from)
);

comment on table pay_rates is 'One row per rate period per employee. Current rate = row with effective_to is null (or covering today). Never update hourly_rate in place — insert a new row and close out the old one.';

create index idx_employees_active on employees (active);
create index idx_employees_employment_type on employees (employment_type);
create index idx_users_auth_user_id on users (auth_user_id);
create index idx_users_employee_id on users (employee_id);
create index idx_pay_rates_employee_id on pay_rates (employee_id);

-- Only one "current" (effective_to is null) rate per employee at a time.
create unique index idx_pay_rates_one_current_per_employee
  on pay_rates (employee_id)
  where effective_to is null;
