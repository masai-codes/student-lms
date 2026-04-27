/**
 * Bottom sheet clearance when `AppMobileTabBar` is shown (`md:hidden`, ~4.5rem + safe area).
 * Keep in sync with main column padding in `routes/(protected)/_layout/route.tsx`.
 */
export const MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET =
  'max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))]' as const

/** Pinned drawer footer: extra padding above the home indicator on notched phones. */
export const MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET =
  'max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]' as const

/** Scrollable drawer body: breathing room above the pinned CTA / composer. */
export const MASAIVERSE_DRAWER_SCROLL_BODY_PADDING = 'pb-2' as const

export const isMasaiverseApp = () =>
  typeof window !== 'undefined' &&
  Boolean((window as Window & { isApp?: boolean }).isApp)
