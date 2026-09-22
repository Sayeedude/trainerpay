/**
 * Central place that reads Supabase env vars, so a missing var fails loudly
 * and once, instead of as a cryptic "Invalid URL" deep in a client
 * constructor. See .env.example / the main README for setup.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill in your Supabase project's values.`
    );
  }
  return value;
}

export function getPublicSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getPublicSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Service-role key. Server-only — never import this module from a file that
 * can end up in a client bundle. lib/supabase/admin.ts is the only caller.
 */
export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}
