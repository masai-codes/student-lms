/**
 * Domain types for the masaiverse-v2 UI. These mirror the shape that the
 * single aggregated GET `/api/masaiverse-v2/home` will return, so the dummy
 * data and the eventual API response are interchangeable.
 */

/** Accent palette shared by stat cards and club icons. */
export type AccentColor = 'orange' | 'green' | 'purple' | 'blue'

export interface MasaiverseClub {
  id: string
  name: string
  /** Emoji for now; later this may become an image URL from the API. */
  icon: string
}

export interface MasaiverseV2SidebarData {
  /** Count shown as a badge next to the "Events" nav item. */
  eventsCount: number
  myClubs: Array<MasaiverseClub>
}

export interface MasaiverseUpcomingEvent {
  id: string
  day: string
  month: string
  title: string
  subtitle: string
  /** Action label, e.g. RSVP / Join / Register. */
  ctaLabel: string
}

export interface MasaiverseLeader {
  id: string
  name: string
  role: string
  score: number
  /** Medal emoji for the top ranks; undefined otherwise (numeric rank shown). */
  medal?: string
  /** Avatar background color (hex). */
  avatarColor: string
}
