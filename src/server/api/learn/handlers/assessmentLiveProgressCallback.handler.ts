/**
 * Receives live-progress callbacks from the Assess Platform (the
 * `liveProgressCallbackUrl` passed to `generate-test`). Log-only for now —
 * no persistence.
 */
export async function handleAssessmentLiveProgressCallback(
  request: Request,
): Promise<Response> {
  console.log(
    '[assessment-callback/live-progress] incoming request',
    request.method,
    request.url,
  )
  try {
    const rawBody = await request.text()
    let body: unknown = rawBody
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.warn('[assessment-callback/live-progress] body is not valid JSON')
    }
    console.log(
      '[assessment-callback/live-progress] payload:',
      JSON.stringify(body, null, 2),
    )
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error(
      '[assessment-callback/live-progress] error handling request',
      error,
    )
    return new Response('error', { status: 500 })
  }
}
