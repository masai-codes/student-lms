import { useQuery } from '@tanstack/react-query'
import { getMasaiverseAccessDebugServer } from '@/server/masaiverse/getMasaiverseAccessDebugServer'
import { isAppInstalledForUserServer } from '@/server/devices/isAppInstalledForUserServer'
import { isIHubPortal, isIitjPortal, isMasaiPortal } from '@/utils/portal'

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
    // Chat is shown to everyone except iHub and IIT Jodhpur — portal-based
    // only, no per-batch flag exists for it (unlike MasaiVerse).
    showChat: !isIHub && !isIitj,
    showMasaiVerse: canShowMasaiVerse,
    // Refer & Earn is disabled entirely for iHub and IIT Jodhpur.
    showReferAndEarn: !isIHub && !isIitj,
    isAppInstalled,
    isIHub,
    isIitj,
  }
}
