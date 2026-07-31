import { markInLectureQuizGraded } from '@/server/learn/services/inLectureQuizGradedStore'

/**
 * Receives grading/event callbacks from the Assess Platform (the
 * `callback_url` passed to `generate-test` for in-lecture popup quizzes).
 * Always logs the payload. On `eventType: "gradeAssessment"` it also marks
 * the attempt (`uniqueID`) graded, which the quiz-status polling endpoint
 * ([getInLectureQuizGradedStatus.service.ts]) then surfaces to the open modal.
 */
export async function handleAssessmentCallback(
  request: Request,
): Promise<Response> {
  console.log(
    '[assessment-callback] incoming request',
    request.method,
    request.url,
  )
  try {
    const rawBody = await request.text()
    let body: unknown = rawBody
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.warn('[assessment-callback] body is not valid JSON')
    }
    console.log(
      '[assessment-callback] payload:',
      JSON.stringify(body, null, 2),
    )

    if (body != null && typeof body === 'object') {
      const { eventType, uniqueID } = body as Record<string, unknown>
      if (eventType === 'gradeAssessment' && typeof uniqueID === 'string' && uniqueID) {
        await markInLectureQuizGraded(uniqueID)
        console.log('[assessment-callback] marked graded:', uniqueID)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('[assessment-callback] error handling request', error)
    return new Response('error', { status: 500 })
  }
}
