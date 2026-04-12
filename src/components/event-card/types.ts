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
  /** Merged onto the visible card root; override e.g. max-w, h-full, min-h. */
  className?: string
}
