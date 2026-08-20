import { createServerFn } from '@tanstack/react-start'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getMasaiverseAccessDebug } from '@/server/masaiverse/showMasaiversePage'
import { isAppInstalledForUser } from '@/server/devices/isAppInstalledForUser'
import { hasConfiguredInterviewDomains } from '@/server/api/interviews/services/resolveInterviewDomain'
import { isMasaiPortal } from '@/utils/portal'

export type NavGatingSignals = {
  canShowMasaiVerse: boolean
  isAppInstalled: boolean
  showInterviews: boolean
}

/**
 * All per-user nav-gating booleans, resolved together in one round trip. The
 * user is always the current session's — never a client-supplied id — so
 * this can't be used to probe another user's gating state.
 */
async function getNavGatingSignals(userId: number): Promise<NavGatingSignals> {
  const [masaiverseDebug, isAppInstalled, showInterviews] = await Promise.all([
    getMasaiverseAccessDebug(userId),
    isAppInstalledForUser(userId),
    hasConfiguredInterviewDomains(userId),
  ])

  return {
    canShowMasaiVerse: masaiverseDebug.canShowMasaiverse && isMasaiPortal(),
    isAppInstalled,
    showInterviews,
  }
}

export const getNavGatingSignalsServer = createServerFn({
  method: 'GET',
}).handler(async (): Promise<NavGatingSignals> => {
  const userId = await requireSessionUserId()
  return getNavGatingSignals(userId)
})
