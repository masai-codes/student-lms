import { getLevelupSso } from '@/server/levelup/levelupSsoServerFn'

/**
 * Level up SSO: calls this app’s backend (same contract as `experience-api` `GET /levelup-sso`).
 * Server builds a short-lived JWT (`SSO_JWT_SECRET`) and returns Levelup sign-in URL.
 */
export async function fetchLevelupSso(): Promise<{ url: string }> {
  const data = await getLevelupSso()
  return { url: data.data.url }
}
