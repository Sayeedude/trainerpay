import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/permissions/current-user";
import { hasPermission } from "@/lib/permissions/roles";
import { createUserSchema } from "@/lib/validation/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * POST /api/admin/users — provision a login for an employee (or a
 * non-employee admin account).
 *
 * SUPER_ADMIN only (spec section 16: role/settings administration).
 * Demonstrates the intended pattern for privileged server-side operations
 * in this app: check the CALLER's session-derived role first (defense in
 * depth alongside RLS), validate input, then use the service-role client
 * only for the one step that genuinely needs it — creating the Supabase
 * Auth identity, which RLS can't gate because it isn't a `public` table.
 */
export async function POST(request: Request) {
  const caller = await getCurrentAppUser();

  if (!caller || !hasPermission(caller.role, "MANAGE_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const { email, role, employeeId } = parsed.data;

  const admin = createAdminClient();

  const { data: created, error: createAuthError } = await admin.auth.admin.inviteUserByEmail(email);
  if (createAuthError || !created.user) {
    return NextResponse.json(
      { error: createAuthError?.message ?? "Failed to create the auth account" },
      { status: 502 }
    );
  }

  const { data: newUser, error: insertError } = await admin
    .from("users")
    .insert({
      auth_user_id: created.user.id,
      email,
      role,
      employee_id: employeeId ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Best-effort cleanup so we don't leave an orphaned auth identity behind.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    action: "User invited",
    entityType: "users",
    entityId: newUser.id,
    newValue: { email, role, employeeId: employeeId ?? null },
  });

  return NextResponse.json({ id: newUser.id }, { status: 201 });
}
