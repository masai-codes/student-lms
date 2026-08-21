import type { CurrentUser } from '@/server/api/me/getCurrentUser.service'
import { fetchJson } from '@/lib/api/fetchJson'

const ME_API = '/api/me'

/** Fetches the signed-in user's lightweight profile (name for now). */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { user } = await fetchJson<{ user: CurrentUser }>(ME_API)
  return user
}
