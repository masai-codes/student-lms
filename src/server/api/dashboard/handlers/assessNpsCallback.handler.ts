import { handleAssessNpsCallback } from '@/server/api/dashboard/assessNpsCallback.service'

export async function handleAssessNpsCallbackRequest(request: Request): Promise<Response> {
  try {
    const body = await request.json() as Record<string, unknown>
    const submissionId = Number(body['uniqueID'])
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return new Response('invalid uniqueID', { status: 400 })
    }
    const eventType = typeof body['eventType'] === 'string' ? body['eventType'] : undefined
    await handleAssessNpsCallback(submissionId, eventType)
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Assess NPS callback error', error)
    return new Response('error', { status: 500 })
  }
}
