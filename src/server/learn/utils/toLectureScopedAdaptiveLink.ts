// Adaptive ("SAL") lecture join links are stored as
//   https://experience-api.../api/adaptive-lecture/<meetingID>/join
// where one <meetingID> can back multiple lectures. Rewriting the middle
// segment to the lecture id lets the experience-api join handler resolve the
// specific lecture (accurate attendance). Non-adaptive links pass through.
const ADAPTIVE_LINK_SEGMENT = /(\/api\/adaptive-lecture\/)[^/]+(\/join)/

/**
 * Whether a join link points at the adaptive ("SAL") lecture platform. Once the
 * meeting has ended, re-hitting this link 302-redirects to the recording
 * (`.../embed/video/...`), so it doubles as the SAL "watch recording" link.
 */
export function isAdaptiveLectureLink(zoomLink: string | null): boolean {
  return zoomLink != null && ADAPTIVE_LINK_SEGMENT.test(zoomLink)
}

/**
 * Rewrite an adaptive-lecture join link so its middle segment is the lecture id.
 * Non-adaptive links (and null/blank) are returned unchanged.
 *
 * When `token` is given it is appended as a `?token=` fallback the experience-api
 * join handler verifies when no session cookie is present. When `baseUrl` is
 * given the link's origin (scheme + host) is swapped to it, so an iHub link can
 * point at the iHub experience-api host and receive the iHub session cookie
 * (scoped to `.ihubiitrcourses.org`). A missing/malformed `baseUrl` leaves the
 * stored host untouched. Mirrors experience-api's helper of the same name.
 */
export function toLectureScopedAdaptiveLink(
  zoomLink: string | null,
  lectureId: number,
  token?: string,
  baseUrl?: string | null,
): string | null {
  if (!zoomLink) return zoomLink ?? null
  if (!ADAPTIVE_LINK_SEGMENT.test(zoomLink)) return zoomLink
  let link = zoomLink.replace(ADAPTIVE_LINK_SEGMENT, `$1${lectureId}$2`)
  if (baseUrl) {
    try {
      const dest = new URL(baseUrl)
      const src = new URL(link)
      src.protocol = dest.protocol
      src.host = dest.host
      link = src.toString()
    } catch {
      // malformed baseUrl or link — keep the path-rewritten link as-is
    }
  }
  if (token) {
    link += `${link.includes('?') ? '&' : '?'}token=${token}`
  }
  return link
}
