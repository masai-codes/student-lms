// Adaptive ("SAL") lecture join links are stored as
//   https://experience-api.../api/adaptive-lecture/<meetingID>/join
// where one <meetingID> can back multiple lectures. Rewriting the middle
// segment to the lecture id lets the experience-api join handler resolve the
// specific lecture (accurate attendance). Non-adaptive links pass through.
const ADAPTIVE_LINK_SEGMENT = /(\/api\/adaptive-lecture\/)[^/]+(\/join)/

/**
 * Rewrite an adaptive-lecture join link so its middle segment is the lecture id.
 * Non-adaptive links (and null/blank) are returned unchanged.
 */
export function toLectureScopedAdaptiveLink(
  zoomLink: string | null,
  lectureId: number,
): string | null {
  if (!zoomLink) return zoomLink ?? null
  if (!ADAPTIVE_LINK_SEGMENT.test(zoomLink)) return zoomLink
  return zoomLink.replace(ADAPTIVE_LINK_SEGMENT, `$1${lectureId}$2`)
}
