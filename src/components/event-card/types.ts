export type DrawerDirection = "right" | "bottom" | "auto"

export type EventTimelineItem = {
  time: string
  text: string
}

export type EventCardProps = {
  title: string
  miniDescription: string
  ctaText: string
  cardCtaText?: string
  drawerCtaText?: string
  hideCardCta?: boolean
  hideDrawerCta?: boolean
  isActive: boolean
  category: string
  image: string
  date: string
  time: string
  isOnline: boolean
  eventLocationLink?: string
  showLocationTextInMapsTag?: boolean
  eventLocationText?: string
  eventMode: string
  eventDetailDescription: string
  eventTimeline: EventTimelineItem[]
  onCtaClick?: () => void
  drawerDirection?: DrawerDirection
  /**
   * Merged onto `Dialog.Content` — use on bottom sheets to clear a fixed bottom tab bar, e.g.
   * `pb-[calc(4.5rem+env(safe-area-inset-bottom))]`.
   */
  drawerBottomInsetClassName?: string
  /** Extra classes on the scrollable body (e.g. `pb-4` so the last line clears the pinned footer). */
  drawerBodyClassName?: string
  /**
   * When `true` (default), the drawer CTA sits in a fixed footer below the scroll area.
   * When `false`, the CTA scrolls with the rest of the content.
   */
  drawerPinFooter?: boolean
  /** Merged onto the footer row when `drawerPinFooter` is true (e.g. shadow, safe-area padding). */
  drawerFooterClassName?: string
  /** Merged onto the visible card root; override e.g. max-w, h-full, min-h. */
  className?: string
}
