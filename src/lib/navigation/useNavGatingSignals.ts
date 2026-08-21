import { useQuery } from '@tanstack/react-query'
import { getNavGatingSignalsServer } from '@/server/navigation/getNavGatingSignals'
import {
  isChatPortal,
  isIHubPortal,
  isIitjPortal,
  isMobileAppPortal,
} from '@/utils/portal'

/**
 * Every boolean signal `useAppNavItems` needs to decide what to show — kept
 * in one hook so the nav-item builder itself stays a plain data-in/data-out
 * function instead of a bag of ad hoc queries.
 *
 * The per-user signals (MasaiVerse, app-installed, Interviews) are fetched in
 * one round trip via `getNavGatingSignalsServer` — the server resolves them
 * for the current session's user, never a client-supplied id, so there's
 * nothing here for a tampered request to probe another user's gating state
 * with. `userId` is only used to key/segment the query cache.
 */
export function useNavGatingSignals(userId: number) {
  const isIHub = isIHubPortal()
  const isIitj = isIitjPortal()

  const { data } = useQuery({
    queryKey: ['nav-gating-signals', userId],
    queryFn: () => getNavGatingSignalsServer(),
    staleTime: 30 * 60 * 1000,
  })

  return {
    // Chat is portal-based only — no per-batch flag exists for it (unlike
    // MasaiVerse). The allowlist (`CHAT_PORTALS`: masai + iitj) is the single
    // source of truth; don't re-derive it as a "not iHub, not IITJ" check here.
    showChat: isChatPortal(),
    showMasaiVerse: data?.canShowMasaiVerse ?? false,
    // Interviews tab is gated per-batch: shown only if at least one of the
    // user's enrolled batches has `meta.interviews` configured (non-empty).
    showInterviews: data?.showInterviews ?? false,
    // Refer & Earn is disabled entirely for iHub and IIT Jodhpur.
    showReferAndEarn: !isIHub && !isIitj,
    isAppInstalled: data?.isAppInstalled ?? false,
    // "Get the app" only exists on portals the mobile app actually ships for —
    // today that's Masai alone (allowlist in `MOBILE_APP_PORTALS`), so iHub and
    // IIT Jodhpur both drop it.
    hasMobileApp: isMobileAppPortal(),
    isIHub,
    isIitj,
  }
}
