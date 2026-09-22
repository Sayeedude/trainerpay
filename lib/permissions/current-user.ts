import { createClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/permissions/roles";

export interface CurrentAppUser {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
}

/**
 * Server-side helper: resolves the signed-in Supabase Auth user to their
 * `users` row (id, role, employee_id). Returns null if nobody is signed in,
 * or if a Supabase Auth user exists with no matching `users` row yet (e.g.
 * mid-provisioning) — callers should treat that the same as "not
 * authorized" rather than crash.
 */
export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, employee_id, active")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (error || !data || !data.active || !isRole(data.role)) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    employeeId: data.employee_id,
  };
}
