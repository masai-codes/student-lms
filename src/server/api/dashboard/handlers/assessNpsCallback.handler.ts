import { handleAssessNpsCallback } from '@/server/api/dashboard/assessNpsCallback.service'

export async function handleAssessNpsCallbackRequest(
  request: Request,
): Promise<Response> {
  console.log(
    '[assess-nps-callback] incoming request',
    request.method,
    request.url,
  )
  console.log(
    '[assess-nps-callback] headers:',
    JSON.stringify(Object.fromEntries(request.headers.entries())),
  )
  try {
    const rawBody = await request.text()
    console.log('[assess-nps-callback] raw body:', rawBody)
    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      console.error('[assess-nps-callback] failed to parse body as JSON')
      return new Response('invalid JSON', { status: 400 })
    }
    console.log(
      '[assess-nps-callback] parsed body:',
      JSON.stringify(body, null, 2),
    )
    const submissionId = Number(body['uniqueID'])
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return new Response('invalid uniqueID', { status: 400 })
    }
    const eventType =
      typeof body['eventType'] === 'string' ? body['eventType'] : undefined
    await handleAssessNpsCallback(submissionId, eventType)
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Assess NPS callback error', error)
    return new Response('error', { status: 500 })
  }
}
