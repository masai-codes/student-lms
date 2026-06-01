/**
 * Domain types for the masaiverse-v2 UI. These mirror the shape that the
 * single aggregated GET `/api/masaiverse-v2/home` will return, so the dummy
 * data and the eventual API response are interchangeable.
 */

export interface MasaiverseClub {
  id: string
  name: string
  /** Emoji for now; later this may become an image URL from the API. */
  icon: string
}

export interface MasaiverseClubDetail extends MasaiverseClub {
  description: string
  membersCount: number
  category: string
}

export interface MasaiverseV2SidebarData {
  /** Count shown as a badge next to the "Events" nav item. */
  eventsCount: number
  myClubs: Array<MasaiverseClub>
}
