import { createClientForServer } from './client'

export interface SupabaseRpcResult {
  data: unknown
  error: unknown
}

/**
 * Updates a user's Supabase profile avatar by email via the
 * `update_profile_avatar_by_email` RPC. Best-effort: never throws — returns the
 * error instead so callers can log and continue. Mirrors experience-api's
 * `updateProfileAvatarByEmail`.
 */
export async function updateProfileAvatarByEmail(
  p_user_email: string,
  p_avatar_url: string,
): Promise<SupabaseRpcResult> {
  try {
    const supabase = createClientForServer()
    const { data, error } = await supabase.rpc(
      'update_profile_avatar_by_email',
      {
        p_user_email,
        p_avatar_url,
      },
    )
    return { data, error }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Unknown error occurred'),
    }
  }
}
