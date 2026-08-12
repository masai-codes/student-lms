/**
 * Assess product authentication for the test-generation routes.
 *
 * Assess is adding auth to their test-generation APIs. Every call to those
 * routes must carry two headers:
 *   client-id:      the client id we already send (unchanged)
 *   product-secret: one secret per PRODUCT (LMS), not per client — the same
 *                   value covers every client id this product uses.
 *
 * In-scope routes (per Assess): /student/assessments/generate-test,
 * .../generate-test-bulk, .../generate-test-bulk/:jobId/status,
 * .../quick-generate-test, /student/assessments/:id/info,
 * /student/new-assessment. `update-assessment-info`, `get-submission-view-url`
 * and `endassessment` are NOT in scope.
 *
 * Today unauthenticated calls still succeed and Assess returns an
 * `x-assess-auth-warning` response header; enforcement (401) is turned on per
 * product only after a week of zero non-compliant calls. So a missing
 * ASSESS_PRODUCT_SECRET deliberately does NOT throw — it degrades to today's
 * behaviour and logs, rather than breaking URL generation before enforcement.
 *
 * Server-only: this module lives under src/server and must never be imported
 * from client code — the secret must not ship in a browser bundle.
 */

/** Headers to spread into every in-scope Assess test-generation request. */
export function assessProductAuthHeaders(
  clientId?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {}
  const productSecret = process.env.ASSESS_PRODUCT_SECRET?.trim()

  if (clientId) headers['client-id'] = clientId
  if (productSecret) {
    headers['product-secret'] = productSecret
  } else {
    console.warn(
      '[assess] ASSESS_PRODUCT_SECRET is not set — test-generation calls are unauthenticated and will 401 once Assess enforces',
    )
  }
  return headers
}

/**
 * Logs Assess's migration warning header so compliance is visible from our own
 * logs. MISSING_SECRET = header not sent, INVALID_SECRET = sent but wrong
 * (stale value or a trailing newline in the env var). No header = migrated.
 */
export function logAssessAuthWarning(
  response: Response,
  context: Record<string, unknown> = {},
): void {
  const warning = response.headers.get('x-assess-auth-warning')
  if (warning) {
    console.warn('[assess] auth warning:', warning, context)
  }
}
