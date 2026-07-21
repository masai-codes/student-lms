export interface SupabaseRpcResult {
  data: unknown
  error: unknown
}

/**
 * Updates a user's Supabase profile avatar by email via the
 * `update_profile_avatar_by_email` PostgREST RPC endpoint. Best-effort: never
 * throws — returns the error instead so callers can log and continue. Mirrors
 * experience-api's `updateProfileAvatarByEmail`.
 *
 * Calls the REST API directly (rather than `@supabase/supabase-js`) since this
 * is the only Supabase touchpoint in the app and the SDK's `createClient()`
 * unconditionally pulls in `@supabase/auth-js` (GoTrueClient) even though we
 * never use auth — that dependency previously broke production deploys (see
 * git history) because it required a hoisted `tslib` symlink that CodeDeploy
 * doesn't preserve.
 */
export async function updateProfileAvatarByEmail(
  p_user_email: string,
  p_avatar_url: string,
): Promise<SupabaseRpcResult> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
      )
    }

    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/update_profile_avatar_by_email`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_user_email, p_avatar_url }),
      },
    )

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        body && typeof body === 'object' && 'message' in body
          ? String((body as { message: unknown }).message)
          : `Supabase RPC failed with status ${response.status}`
      return { data: null, error: new Error(message) }
    }

    return { data: body, error: null }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Unknown error occurred'),
    }
  }
}
