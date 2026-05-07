import * as React from "react"

import { EventCardDrawer } from "./event-card-drawer"
import { EventCardPreview } from "./event-card-preview"
import type { DrawerDirection, EventCardProps } from "./types"

function useResolvedDirection(direction: DrawerDirection) {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  return direction === "auto" ? (isDesktop ? "right" : "bottom") : direction
}

export function EventCard({
  title,
  miniDescription,
  ctaText,
  cardCtaText,
  drawerCtaText,
  hideCardCta = false,
  hideDrawerCta = false,
  isActive,
  category,
  image,
  date,
  time,
  isOnline,
  eventLocationLink,
  showLocationTextInMapsTag = true,
  eventLocationText,
  eventMode,
  eventDetailDescription,
  eventTimeline,
  onCtaClick,
  onDrawerOpen,
  onDrawerCtaClick,
  drawerDirection = "auto",
  drawerBottomInsetClassName,
  drawerBodyClassName,
  drawerPinFooter = true,
  drawerFooterClassName,
  className,
}: EventCardProps) {
  const [open, setOpen] = React.useState(false)
  const wasOpenRef = React.useRef(false)
  const resolvedDirection = useResolvedDirection(drawerDirection)
  const resolvedCardCtaText = cardCtaText ?? ctaText
  const resolvedDrawerCtaText = drawerCtaText ?? ctaText

  const handleCtaClick = () => {
    setOpen(true)
  }
  const handleDrawerCtaClick = () => {
    onDrawerCtaClick?.()
    onCtaClick?.()
  }

  React.useEffect(() => {
    if (open && !wasOpenRef.current) {
      onDrawerOpen?.()
    }
    wasOpenRef.current = open
  }, [open, onDrawerOpen])

  return (
    <>
      <EventCardPreview
        title={title}
        miniDescription={miniDescription}
        ctaText={resolvedCardCtaText}
        hideCardCta={hideCardCta}
        isActive={isActive}
        category={category}
        image={image}
        date={date}
        onCtaClick={handleCtaClick}
        className={className}
      />
      <EventCardDrawer
        title={title}
        ctaText={resolvedDrawerCtaText}
        hideDrawerCta={hideDrawerCta}
        isActive={isActive}
        category={category}
        image={image}
        date={date}
        time={time}
        isOnline={isOnline}
        eventLocationLink={eventLocationLink}
        showLocationTextInMapsTag={showLocationTextInMapsTag}
        eventLocationText={eventLocationText}
        eventMode={eventMode}
        eventDetailDescription={eventDetailDescription}
        eventTimeline={eventTimeline}
        onCtaClick={handleDrawerCtaClick}
        open={open}
        onOpenChange={setOpen}
        resolvedDirection={resolvedDirection}
        drawerBottomInsetClassName={drawerBottomInsetClassName}
        drawerBodyClassName={drawerBodyClassName}
        drawerPinFooter={drawerPinFooter}
        drawerFooterClassName={drawerFooterClassName}
      />
    </>
  )
}

export type { EventCardProps, EventTimelineItem, DrawerDirection } from "./types"
