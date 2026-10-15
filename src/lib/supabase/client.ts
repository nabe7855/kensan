import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseEnv } from "./env";

export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

let browserClient: ReturnType<typeof createClient> | null = null;

/** Shared browser client (one auth listener per tab). */
export function getSupabase() {
  browserClient ??= createClient();
  return browserClient;
}
