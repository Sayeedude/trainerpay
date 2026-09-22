import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Thin wrapper around the log_audit_event() Postgres function (see
 * database/migrations/0006_functions_and_triggers.sql). Call this from
 * server-side code right after any action listed in spec section 22
 * (rate changed, leave approved, cover assigned, allocation changed,
 * payroll calculated/approved/finalised/reopened/corrected, employee
 * activated/deactivated, ...).
 *
 * Deliberately does not throw on failure — an audit log write failing
 * should be visible (logged) but must never block the underlying action
 * from completing, or every write in the app becomes coupled to audit_log
 * uptime.
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    action: string;
    entityType: string;
    entityId: string | null;
    oldValue?: unknown;
    newValue?: unknown;
  }
): Promise<void> {
  const { error } = await supabase.rpc("log_audit_event", {
    p_action: event.action,
    p_entity_type: event.entityType,
    p_entity_id: event.entityId,
    p_old_value: event.oldValue ?? null,
    p_new_value: event.newValue ?? null,
  });

  if (error) {
    console.error("[audit] failed to write audit_log entry", {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      error,
    });
  }
}
