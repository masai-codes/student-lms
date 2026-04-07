export type DrawerDirection = "right" | "bottom" | "auto"

export type EventTimelineItem = {
  time: string
  text: string
}

export type EventCardProps = {
  title: string
  miniDescription: string
  ctaText: string
  isActive: boolean
  category: string
  image: string
  date: string
  time: string
  isOnline: boolean
  eventLocationLink?: string
  eventMode: string
  eventDetailDescription: string
  eventTimeline: EventTimelineItem[]
  onCtaClick?: () => void
  drawerDirection?: DrawerDirection
}
