import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase admin client (service-role key).
 *
 * Server-only: this module lives under `src/server/**` and must never be
 * imported into client code — the service-role key would leak. The env vars are
 * deliberately **not** prefixed `VITE_`/`NEXT_PUBLIC_` (which mark a value as
 * client-exposed): `SUPABASE_SERVICE_ROLE_KEY` is a secret, so it stays a plain
 * server env var. `SUPABASE_URL` isn't secret but shares the convention.
 * (experience-api names these `NEXT_PUBLIC_*`, which is a misnomer for a secret;
 * we don't repeat it here.)
 */
export function createClientForServer(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
