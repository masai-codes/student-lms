export type DrawerDirection = "right" | "bottom" | "auto"
export type CtaTheme = "yellow" | "red"

export type ClubCardProps = {
  domain: string
  name: string
  imageUrl: string
  miniDescription: string
  ctaText: string
  onCtaClick?: () => void
  totalMembers: number | string
  detailPoints: string[]
  detailDescription: string
  drawerDirection?: DrawerDirection
  ctaTheme: CtaTheme
}
