export type DrawerDirection = "right" | "bottom" | "auto"
export type CtaTheme = "yellow" | "red"

export type ClubCardProps = {
  domain: string
  name: string
  imageUrl: string
  miniDescription: string
  shouldCompress?: boolean
  showSuccessIcon?: boolean
  ctaText: string
  cardCtaText?: string
  drawerCtaText?: string
  onCtaClick?: () => void
  totalMembers: number | string
  detailPoints: string[]
  detailDescription: string
  drawerDirection?: DrawerDirection
  ctaTheme: CtaTheme
  /**
   * Merged onto `Dialog.Content` — use on bottom sheets to clear a fixed bottom tab bar, e.g.
   * `pb-[calc(4.5rem+env(safe-area-inset-bottom))]`.
   */
  drawerBottomInsetClassName?: string
  /** Extra classes on the scrollable club details area. */
  drawerBodyClassName?: string
  /**
   * When `true` (default), the CTA sits in a fixed footer below the scroll area.
   * When `false`, the CTA scrolls with the club details.
   */
  drawerPinFooter?: boolean
  /** Merged onto the footer row when `drawerPinFooter` is true. */
  drawerFooterClassName?: string
  /** Merged onto the visible card root; override e.g. max-w, h-full, min-h. */
  className?: string
}
