import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseUrl, getServiceRoleKey } from "./env";

/**
 * Service-role Supabase client. Bypasses RLS entirely — this is exactly
 * what spec section 15 means by "no service-role key in browser code" and
 * "no payroll secrets in source code": this client must only ever be
 * constructed in server-only code (API routes, server actions, scheduled
 * jobs), never sent to or importable from the client bundle.
 *
 * The `server-only` import above makes any accidental client-side import of
 * this file fail the build, rather than fail silently at runtime.
 *
 * Use sparingly. Most server-side reads/writes should go through
 * lib/supabase/server.ts (the user's own session, scoped by RLS) so that
 * RLS stays the real enforcement layer. Reach for this client only for
 * genuinely privileged operations the calling user's own RLS grants
 * shouldn't cover on their own — e.g. Supabase Auth admin calls when
 * provisioning a new user's `users` row.
 */
export function createAdminClient() {
  return createSupabaseClient(getPublicSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
