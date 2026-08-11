import { useQuery } from '@tanstack/react-query'
import { getMasaiverseAccessDebugServer } from '@/server/masaiverse/getMasaiverseAccessDebugServer'
import { isAppInstalledForUserServer } from '@/server/devices/isAppInstalledForUserServer'
import {
  isChatPortal,
  isIHubPortal,
  isIitjPortal,
  isMasaiPortal,
  isMobileAppPortal,
} from '@/utils/portal'

/**
 * Every boolean signal `useAppNavItems` needs to decide what to show — kept
 * in one hook so the nav-item builder itself stays a plain data-in/data-out
 * function instead of a bag of ad hoc queries.
 */
export function useNavGatingSignals(userId: number) {
  const isIHub = isIHubPortal()
  const isIitj = isIitjPortal()
  const isMasai = isMasaiPortal()
  const { data: canShowMasaiVerse = false } = useQuery({
    queryKey: ['nav-can-show-masaiverse', userId],
    queryFn: async () => {
      const result = await getMasaiverseAccessDebugServer({ data: { userId } })
      return result.canShowMasaiverse && isMasai
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: isAppInstalled = false } = useQuery({
    queryKey: ['nav-is-app-installed', userId],
    queryFn: () => isAppInstalledForUserServer({ data: { userId } }),
    staleTime: 5 * 60 * 1000,
  })

  return {
    // Chat is portal-based only — no per-batch flag exists for it (unlike
    // MasaiVerse). The allowlist (`CHAT_PORTALS`: masai + iitj) is the single
    // source of truth; don't re-derive it as a "not iHub, not IITJ" check here.
    showChat: isChatPortal(),
    showMasaiVerse: canShowMasaiVerse,
    // Refer & Earn is disabled entirely for iHub and IIT Jodhpur.
    showReferAndEarn: !isIHub && !isIitj,
    isAppInstalled,
    // "Get the app" only exists on portals the mobile app actually ships for —
    // today that's Masai alone (allowlist in `MOBILE_APP_PORTALS`), so iHub and
    // IIT Jodhpur both drop it.
    hasMobileApp: isMobileAppPortal(),
    isIHub,
    isIitj,
  }
}
