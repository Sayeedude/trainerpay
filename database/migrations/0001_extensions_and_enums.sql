-- 0001_extensions_and_enums.sql
-- TrainerPay Phase 1: extensions and enumerated types.
-- Applied in order by filename. See database/README.md for how to run these
-- against a Supabase project.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Application role. Distinct from employees.role (a free-text job title).
create type user_role as enum (
  'SUPER_ADMIN',
  'PAYROLL_ADMIN',
  'ACADEMIC_MANAGER',
  'TRAINER',
  'EMPLOYEE'
);

-- How an employee is engaged and paid. See spec section 4.
create type employment_type as enum (
  'HOURLY_TEACHER',
  'FULL_TIME_SALARIED',
  'PART_TIME_SALARIED',
  'FORMER'
);

-- Class category. See spec section 9.
create type activity_type as enum (
  'GROUP_CLASS',
  'PRINCIPAL_STUDY',
  'SIS_INDIVIDUAL'
);

create type class_status as enum (
  'SCHEDULED',
  'CANCELLED'
);

-- Whether a class_allocations row represents the regularly rostered trainer
-- or someone covering for them. Leave itself lives in the `leave` table;
-- this only distinguishes the two payable-record types described in spec
-- section 8 ("Two payable records where applicable").
create type allocation_type as enum (
  'REGULAR',
  'COVER'
);

-- Workflow status for a single class_allocations row. See spec section 10.
create type allocation_status as enum (
  'DRAFT',
  'ALLOCATED',
  'LEAVE',
  'COVER_REQUIRED',
  'COVERED',
  'APPROVED',
  'PAYROLL_PROCESSED'
);

-- Tells the payroll engine whether class_allocations.payroll_hours still
-- needs the teacher multiplier applied, or was imported already-adjusted.
-- See spec section 7 ("Never multiply an already-multiplied payroll hour").
create type hours_source as enum (
  'CALCULATED',      -- payroll_hours = raw_hours * multiplier, computed by the system
  'IMPORTED_FINAL'    -- payroll_hours was imported already multiplied; use as-is
);

create type leave_type as enum (
  'SICK',
  'ANNUAL',
  'PERSONAL',
  'WITHOUT_PAY'
);

create type leave_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

create type cover_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

create type payroll_period_status as enum (
  'DRAFT',
  'OPEN',
  'REVIEW',
  'APPROVED',
  'FINALISED',
  'EXPORTED'
);

create type payroll_line_status as enum (
  'DRAFT',
  'EXCEPTION',
  'REVIEWED',
  'APPROVED',
  'FINALISED'
);

create type exception_severity as enum (
  'INFO',
  'WARNING',
  'CRITICAL'
);
