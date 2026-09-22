-- 0003_scheduling_tables.sql
-- classes, class_allocations, leave, cover (spec sections 9, 10, 8, 14).
-- This is the "Class Allocation" side of the app — kept separate from
-- payroll tables (0004) per spec section 2's core principle.

create table classes (
  id uuid primary key default gen_random_uuid(),
  class_code text,
  class_name text not null,
  activity_type activity_type not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  raw_hours numeric(5,2) not null check (raw_hours > 0),
  status class_status not null default 'SCHEDULED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_end_after_start check (end_time > start_time)
);

comment on table classes is 'A single scheduled session. raw_hours is the actual class duration — never pre-multiplied. See spec section 7.';

create table class_allocations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes (id),
  trainer_employee_id uuid not null references employees (id),
  allocation_type allocation_type not null default 'REGULAR',
  allocation_status allocation_status not null default 'DRAFT',
  payroll_hours numeric(6,2),
  hours_source hours_source not null default 'CALCULATED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table class_allocations is 'Who is allocated to teach a class, and what they are payable for. A class can have more than one row (e.g. a REGULAR allocation left in place for paid leave, plus a COVER allocation for the replacement) — see spec section 8.';
comment on column class_allocations.payroll_hours is 'The hours to actually pay for this allocation. When hours_source=CALCULATED this is derived from classes.raw_hours * the trainer''s multiplier by the payroll engine (Phase 4); when IMPORTED_FINAL it was imported already-adjusted and must not be multiplied again.';

create table leave (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id),
  leave_type leave_type not null,
  start_date date not null,
  end_date date not null,
  hours numeric(6,2),
  paid boolean not null default true,
  status leave_status not null default 'PENDING',
  notes text,
  approved_by uuid references users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint leave_end_after_start check (end_date >= start_date),
  -- WITHOUT_PAY leave is unpaid by definition; other leave types are paid
  -- unless explicitly recorded otherwise (spec section 8).
  constraint leave_without_pay_is_unpaid check (leave_type <> 'WITHOUT_PAY' or paid = false)
);

comment on table leave is 'Approved leave keeps the regular trainer paid (paid=true) or not (paid=false / WITHOUT_PAY), independent of whether someone covered the class. See spec section 8.';

create table cover (
  id uuid primary key default gen_random_uuid(),
  class_allocation_id uuid not null references class_allocations (id),
  replacement_employee_id uuid not null references employees (id),
  hours numeric(6,2),
  reason text,
  status cover_status not null default 'PENDING',
  approved_by uuid references users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table cover is 'A replacement trainer assigned to a class_allocations row. Approved cover generates its own payable COVER allocation for the replacement — see spec section 8.';

create index idx_classes_date on classes (date);
create index idx_class_allocations_class_id on class_allocations (class_id);
create index idx_class_allocations_trainer_id on class_allocations (trainer_employee_id);
create index idx_class_allocations_status on class_allocations (allocation_status);
create index idx_leave_employee_id on leave (employee_id);
create index idx_leave_dates on leave (start_date, end_date);
create index idx_cover_class_allocation_id on cover (class_allocation_id);
create index idx_cover_replacement_employee_id on cover (replacement_employee_id);
