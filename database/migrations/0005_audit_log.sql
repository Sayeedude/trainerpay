-- 0005_audit_log.sql
-- audit_log (spec sections 14, 22). Append-only: no UPDATE/DELETE policy is
-- ever granted to any role (see 0009_rls_audit.sql) — rows are written only
-- via the log_audit_event() SECURITY DEFINER function from 0006, called by
-- application code or triggers, never inserted directly by client roles.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

comment on table audit_log is 'Who did what, when, with before/after values. Written only through log_audit_event(); immutable once written. Examples of action: Rate changed, Leave approved, Cover assigned, Allocation changed, Payroll calculated/approved/finalised/reopened, Employee activated/deactivated.';

create index idx_audit_log_entity on audit_log (entity_type, entity_id);
create index idx_audit_log_user_id on audit_log (user_id);
create index idx_audit_log_created_at on audit_log (created_at desc);
