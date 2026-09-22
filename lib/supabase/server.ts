import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "./env";

/**
 * Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads/writes the session via Next's cookie store. Still uses the
 * anon key — this is the *user's* session, scoped by RLS, not an admin
 * client. For trusted server-only operations that must bypass RLS (e.g.
 * writing audit_log via log_audit_event, which is itself SECURITY DEFINER
 * so it usually doesn't need this), see lib/supabase/admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getPublicSupabaseUrl(), getPublicSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from a Server Component in some code paths,
          // where cookies() is read-only. Safe to ignore as long as
          // middleware.ts is also refreshing the session (it is).
        }
      },
    },
  });
}
