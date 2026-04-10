import * as React from "react"
import { ClubCardPreview } from "./club-card-preview"
import { ClubCardDrawer } from "./club-card-drawer"
import type { ClubCardProps, DrawerDirection } from "./types"

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

export function ClubCard({
  domain,
  name,
  imageUrl,
  miniDescription,
  shouldCompress = false,
  showSuccessIcon = false,
  ctaText,
  cardCtaText,
  drawerCtaText,
  onCtaClick,
  totalMembers,
  detailPoints,
  detailDescription,
  drawerDirection = "auto",
  ctaTheme,
}: ClubCardProps) {
  const [open, setOpen] = React.useState(false)
  const resolvedDirection = useResolvedDirection(drawerDirection)
  const resolvedCardCtaText = cardCtaText ?? ctaText
  const resolvedDrawerCtaText = drawerCtaText ?? ctaText

  const handleCtaClick = () => {
    setOpen(true)
  }

  return (
    <>
      <ClubCardPreview
        domain={domain}
        name={name}
        imageUrl={imageUrl}
        miniDescription={miniDescription}
        shouldCompress={shouldCompress}
        showSuccessIcon={showSuccessIcon}
        ctaText={resolvedCardCtaText}
        ctaTheme={ctaTheme}
        onCtaClick={handleCtaClick}
      />
      <ClubCardDrawer
        domain={domain}
        name={name}
        imageUrl={imageUrl}
        totalMembers={totalMembers}
        detailPoints={detailPoints}
        detailDescription={detailDescription}
        ctaText={resolvedDrawerCtaText}
        ctaTheme={ctaTheme}
        onCtaClick={onCtaClick}
        open={open}
        onOpenChange={setOpen}
        resolvedDirection={resolvedDirection}
      />
    </>
  )
}

export type { ClubCardProps, DrawerDirection, CtaTheme } from "./types"
