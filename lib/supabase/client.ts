"use client";

/**
 * Browser Supabase client. Uses only the public URL + anon key — RLS is
 * what keeps this safe to ship to the client. Never import the service role
 * key here (see lib/supabase/admin.ts and env.ts).
 */

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(getPublicSupabaseUrl(), getPublicSupabaseAnonKey());
}
