/**
 * Masaiverse v2 aggregated home data.
 *
 * The v2 design collapses the multiple home-tab calls (clubs, events,
 * banners, club membership, event enrollments) into a single GET so the
 * page can render from one request. The business logic will be ported from
 * the existing `@/server/masaiverse/*` helpers; for now this returns an empty
 * canvas payload so the REST contract and the v2 UI can be wired up first.
 */
export interface MasaiverseV2HomeData {
  clubs: Array<unknown>
  events: Array<unknown>
  banners: Array<unknown>
  membership: { joinedClubId: string | null }
  enrolledEventIds: Array<string>
}

export function getMasaiverseV2Home(
  _userId: number,
): Promise<MasaiverseV2HomeData> {
  return Promise.resolve({
    clubs: [],
    events: [],
    banners: [],
    membership: { joinedClubId: null },
    enrolledEventIds: [],
  })
}
