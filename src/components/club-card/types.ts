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
  /** Merged onto the visible card root; override e.g. max-w, h-full, min-h. */
  className?: string
}
