import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "./env";

/**
 * Public routes that don't require a signed-in session. Everything else is
 * redirected to /login. Keep this list short and explicit rather than
 * pattern-matching, so a new route is protected-by-default.
 */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/set-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Called from proxy.ts (Next.js 16's renamed middleware.ts convention) on
 * every request. Refreshes the Supabase
 * session cookie (required for SSR auth to keep working) and redirects
 * unauthenticated requests away from protected routes.
 *
 * This is a convenience/UX redirect, not the security boundary — RLS in
 * the database is what actually protects data even if a request reaches a
 * route handler. See database/policies/role_permission_matrix.md.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getPublicSupabaseUrl(), getPublicSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // API routes get a JSON 401 from the route handler itself (see e.g.
  // app/api/admin/users/route.ts), not an HTML redirect — a fetch() caller
  // following a 307 to a login page is rarely what anyone wants.
  if (!user && !isPublicPath(request.nextUrl.pathname) && !isApiRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
