/**
 * ZEF with IVS (`lectures.zoom_details.redirectionType === 'ivs'`) mints its join
 * URL server-side from the lecture + user, so those lectures legitimately carry
 * no `zoom_link`. Anything that gates the join CTA on a link has to know this.
 *
 * Accepts the raw column (object or JSON string) or an already-parsed object.
 */
export function isIvsZoomRedirection(zoomDetails: unknown): boolean {
  if (zoomDetails == null) return false

  let parsed: unknown = zoomDetails
  if (typeof zoomDetails === 'string') {
    try {
      parsed = JSON.parse(zoomDetails)
    } catch {
      return false
    }
  }

  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    (parsed as Record<string, unknown>).redirectionType === 'ivs'
  )
}
