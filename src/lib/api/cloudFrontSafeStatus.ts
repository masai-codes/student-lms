/**
 * Prod serves the app through CloudFront, which has custom error responses for
 * 403 and 404 that rewrite them to a 200 + the SPA's `index.html` (so deep links
 * resolve to the client router). The side effect: any API route that legitimately
 * returns 403/404 reaches the browser as an empty 200 with an HTML body, the JSON
 * error is swallowed, and the client crashes (e.g. destructuring an undefined
 * result, or `error.status` never matching 404).
 *
 * Fix: send 403/404 on a wire status CloudFront passes through (422). The real
 * status travels in the `x-true-status` header and is restored on the client, so
 * status-based branching such as `error.status === 404` keeps working unchanged.
 *
 * If CloudFront's intercepted set ever changes, update CLOUDFRONT_INTERCEPTED here
 * — every API/auth error response funnels through this helper.
 */
const TRUE_STATUS_HEADER = 'x-true-status'

/** Statuses CloudFront intercepts on prod and would otherwise swallow. */
const CLOUDFRONT_INTERCEPTED = new Set<number>([403, 404])

/** Wire status substituted for any CloudFront-intercepted status. */
const CLOUDFRONT_SAFE_WIRE_STATUS = 422

function isCloudFrontIntercepted(status: number): boolean {
  return CLOUDFRONT_INTERCEPTED.has(status)
}

/**
 * Given an intended HTTP status, returns the `{ status, headers }` to put on the
 * outgoing Response. For intercepted statuses this swaps in the safe wire status
 * and records the true status in a header; everything else passes through.
 */
export function cloudFrontSafeResponseInit(status: number): {
  status: number
  headers?: Record<string, string>
} {
  if (isCloudFrontIntercepted(status)) {
    return {
      status: CLOUDFRONT_SAFE_WIRE_STATUS,
      headers: { [TRUE_STATUS_HEADER]: String(status) },
    }
  }
  return { status }
}

/** Restores the true status from a response, falling back to the wire status. */
export function resolveTrueStatus(response: Response): number {
  const header = response.headers.get(TRUE_STATUS_HEADER)
  const parsed = header ? Number(header) : NaN
  return Number.isFinite(parsed) ? parsed : response.status
}
