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
 */
export function toLectureScopedAdaptiveLink(
  zoomLink: string | null,
  lectureId: number,
): string | null {
  if (!zoomLink) return zoomLink ?? null
  if (!ADAPTIVE_LINK_SEGMENT.test(zoomLink)) return zoomLink
  return zoomLink.replace(ADAPTIVE_LINK_SEGMENT, `$1${lectureId}$2`)
}
