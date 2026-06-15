/**
 * Shared presentation types for the masaiverse-v2 UI.
 */

/** Accent palette shared by stat cards and club icons. */
export type AccentColor = 'orange' | 'green' | 'purple' | 'blue'

/** A single stat card in the home stats strip. */
export interface MasaiverseStat {
  id: string
  emoji: string
  value: string
  label: string
  accent: AccentColor
}

/** A club entry shown on the clubs listing and detail pages. */
export interface MasaiverseClubDetail {
  id: string
  name: string
  icon: string
  category: string
  membersCount: number
  tagline: string
  accent: AccentColor
  description: string
}

/** A line item in a highlight card's meta row. */
export interface MasaiverseHighlightMeta {
  emoji: string
  text: string
}

/** A "last week's highlights" recap card. */
export interface MasaiverseHighlight {
  id: string
  emoji: string
  /** Optional hex accent override for the card. */
  accentColor?: string
  category: string
  title: string
  meta: Array<MasaiverseHighlightMeta>
  ctaLabel: string
  ctaTone: AccentColor
}

/** A leader entry in the "this month's leaders" list. */
export interface MasaiverseLeader {
  id: string
  name: string
  role: string
  score: number
  /** Optional medal emoji for top ranks. */
  medal?: string
  avatarColor: string
}

/** A club summary shown in the sidebar "my clubs" list. */
export interface MasaiverseSidebarClub {
  id: string
  name: string
  icon: string
}

/** Sidebar data, shaped like the home API response. */
export interface MasaiverseV2SidebarData {
  eventsCount: number
  myClubs: Array<MasaiverseSidebarClub>
}

/** An event card in the "this week on masaiverse" section. */
export interface MasaiverseWeekEvent {
  id: string
  badgeLabel: string
  isLive: boolean
  dateDay: string
  dateMonth: string
  emoji: string
  bannerColor: string
  category: string
  title: string
  subtitle: string
}

/** An event row in the calendar drawer's "upcoming events" list. */
export interface MasaiverseUpcomingEvent {
  id: string
  day: string
  month: string
  title: string
  subtitle: string
  ctaLabel: string
}

