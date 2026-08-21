import type { AppOrigin } from '@/utils/appOrigin'
import { getAppOrigin } from '@/utils/appOrigin'
import {
  portalHasChat,
  portalHasMasaiLivePromo,
  portalHasMobileApp,
  portalShowsAttendanceDisclaimerBanner,
  portalShowsCatchUpCountdown,
  portalShowsSectionOnLearnCard,
  portalUsesWatchedAttendanceWording,
} from '@/utils/portalCapabilities'

/**
 * Frontend portal helpers. Thin, reusable wrappers over {@link getAppOrigin}
 * (which derives 'masai' | 'ihub' from the runtime domain) so components read
 * one intent-revealing predicate instead of re-comparing origins.
 */
export function getPortal(): AppOrigin {
  return getAppOrigin()
}

/** Whether the app is currently running on the iHub portal (domain contains "ihub"). */
export function isIHubPortal(): boolean {
  return getAppOrigin() === 'ihub'
}

/** Whether the app is currently running on the IIT Jodhpur portal (domain contains "iitj"). */
export function isIitjPortal(): boolean {
  return getAppOrigin() === 'iitj'
}

/** Whether the app is currently running on the Masai portal (everything else). */
export function isMasaiPortal(): boolean {
  return getAppOrigin() === 'masai'
}

/**
 * Whether the current portal hides the Masai-only surfaces (MasaiVerse, Refer &
 * Earn, guided-tour icon, LevelUp, Practice Interviews, LMS support, Download
 * App). True for BOTH iHub and IIT Jodhpur — i.e. every non-Masai portal.
 *
 * Chat is NOT one of these — it ships for Masai *and* IIT Jodhpur and is gated
 * by {@link isChatPortal}.
 */
export function hidesMasaiOnlyFeatures(): boolean {
  return !isMasaiPortal()
}

/**
 * Whether Chat is available on the portal we're running on — gates the navbar
 * chat icon and the mobile tab bar's Chat entry. The allowlist lives in
 * `CHAT_PORTALS` (`@/utils/portalCapabilities`) — add or remove portals there,
 * not here.
 */
export function isChatPortal(): boolean {
  return portalHasChat(getAppOrigin())
}

/**
 * Whether the hardcoded Masai Live promo slide shows on the portal we're running
 * on — it advertises a Masai-branded live session, so IIT Jodhpur hides it. The
 * allowlist lives in `MASAI_LIVE_PROMO_PORTALS` (`@/utils/portalCapabilities`).
 */
export function showsMasaiLivePromo(): boolean {
  return portalHasMasaiLivePromo(getAppOrigin())
}

/**
 * Whether the mobile app (Masai Learn) exists for the portal we're running on —
 * gates the navbar "Download App" action and the download-app guided-tour step.
 * The allowlist lives in `MOBILE_APP_PORTALS` (`@/utils/portalCapabilities`) —
 * add or remove portals there, not here.
 */
export function isMobileAppPortal(): boolean {
  return portalHasMobileApp(getAppOrigin())
}

/**
 * Whether `/learn` listing cards show the section label as an extra chip on the
 * portal we're running on — IIT Jodhpur only. The allowlist lives in
 * `SECTION_ON_LEARN_CARD_PORTALS` (`@/utils/portalCapabilities`).
 */
export function showsSectionOnLearnCard(): boolean {
  return portalShowsSectionOnLearnCard(getAppOrigin())
}

/**
 * Whether lecture attendance reads as watch progress ("Watched" / "Not
 * Watched") instead of presence ("Present" / "Absent") on the portal we're
 * running on — IIT Jodhpur only. The allowlist lives in
 * `WATCHED_ATTENDANCE_WORDING_PORTALS` (`@/utils/portalCapabilities`).
 */
export function usesWatchedAttendanceWording(): boolean {
  return portalUsesWatchedAttendanceWording(getAppOrigin())
}

/**
 * Whether the catch-up "N days remaining" countdown is shown on the portal
 * we're running on — hidden for IIT Jodhpur. The allowlist lives in
 * `CATCH_UP_COUNTDOWN_PORTALS` (`@/utils/portalCapabilities`).
 */
export function showsCatchUpCountdown(): boolean {
  return portalShowsCatchUpCountdown(getAppOrigin())
}

/**
 * Whether the blue attendance disclaimer strip shows beneath the recording on
 * the lecture detail page for the portal we're running on — hidden for IIT
 * Jodhpur. The allowlist lives in `ATTENDANCE_DISCLAIMER_BANNER_PORTALS`
 * (`@/utils/portalCapabilities`).
 */
export function showsAttendanceDisclaimerBanner(): boolean {
  return portalShowsAttendanceDisclaimerBanner(getAppOrigin())
}
