/**
 * Central place that reads Supabase env vars, so a missing var fails loudly
 * and once, instead of as a cryptic "Invalid URL" deep in a client
 * constructor. See .env.example / the main README for setup.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill in your Supabase project's values.`
    );
  }
  return value;
}

// NEXT_PUBLIC_* vars must be read via a static `process.env.NEXT_PUBLIC_X`
// property access (not a dynamic `process.env[name]`) so Next.js's bundler
// can statically find and inline the value into the client bundle. A
// dynamic lookup works server-side (real process.env at runtime) but always
// comes back undefined in the browser.
export function getPublicSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getPublicSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Service-role key. Server-only — never import this module from a file that
 * can end up in a client bundle. lib/supabase/admin.ts is the only caller.
 * This one is fine to read dynamically since it's never bundled for the browser.
 */
export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}
