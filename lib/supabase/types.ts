/**
 * Minimal hand-written row types for Phase 1. These will be replaced by
 * generated types once the schema is deployed:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/database.types.ts
 *
 * Kept intentionally small right now — only what auth/role code actually
 * touches — rather than hand-duplicating the full schema from
 * database/migrations, which would just go stale.
 */

import type { Role } from "@/lib/permissions/roles";

export interface AppUserRow {
  id: string;
  auth_user_id: string;
  email: string;
  role: Role;
  employee_id: string | null;
  active: boolean;
  created_at: string;
}
