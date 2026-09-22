import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the middleware.ts file convention to proxy.ts — same
// mechanism, new name/export. See lib/supabase/middleware.ts for the actual
// session-refresh + route-protection logic (kept in lib/ so it's easy to
// find alongside the rest of the Supabase glue, per the spec's repo
// structure).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
