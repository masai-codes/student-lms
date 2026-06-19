import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { assessNpsForm, assessNpsSubmissions, users } from '@/db/schema'

export interface AssessLinkResult {
  url: string | null
  completed: boolean
}

function isCompleted(submission: { completedAt: string | null; assessCallback: string | null }): boolean {
  if (submission.completedAt) return true
  const cb = submission.assessCallback
  if (!cb) return false
  if (cb === 'true') return true
  // Legacy: callback stored as JSON (older rows)
  try {
    const parsed = JSON.parse(cb) as { eventType?: string }
    return parsed.eventType === 'endAssessment' || parsed.eventType === 'gradingDurationOver'
  } catch {
    return false
  }
}

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function getAssessLink(formId: number, userId: number): Promise<AssessLinkResult> {
  const [form] = await db
    .select({
      id: assessNpsForm.id,
      templateId: assessNpsForm.templateId,
      clientId: assessNpsForm.clientId,
      batchId: assessNpsForm.batchId,
      sectionId: assessNpsForm.sectionId,
    })
    .from(assessNpsForm)
    .where(and(eq(assessNpsForm.id, formId), isNull(assessNpsForm.deletedAt)))
    .limit(1)

  if (!form) throw new Error('ASSESS_FORM_NOT_FOUND')

  // Check for most recent submission
  const [submission] = await db
    .select({
      id: assessNpsSubmissions.id,
      assessLink: assessNpsSubmissions.assessLink,
      completedAt: assessNpsSubmissions.completedAt,
      assessCallback: assessNpsSubmissions.assessCallback,
    })
    .from(assessNpsSubmissions)
    .where(and(eq(assessNpsSubmissions.npsFormId, formId), eq(assessNpsSubmissions.userId, userId)))
    .orderBy(desc(assessNpsSubmissions.id))
    .limit(1)

  if (submission && isCompleted(submission)) {
    return { url: null, completed: true }
  }

  // Create submission row if it doesn't exist
  let submissionId: number
  if (submission) {
    submissionId = submission.id
    // Return cached link if already generated
    if (submission.assessLink) {
      return { url: submission.assessLink, completed: false }
    }
  } else {
    const now = nowMysql()
    try {
      await db
        .insert(assessNpsSubmissions)
        .values({
          npsFormId: formId,
          userId,
          batchId: form.batchId ?? null,
          sectionId: form.sectionId ?? null,
          templateId: form.templateId ?? null,
          clientId: form.clientId ?? null,
          startsAt: now,
          createdAt: now,
          updatedAt: now,
        })
    } catch (err) {
      // Ignore duplicate key — concurrent request already inserted the row
      const isDuplicate =
        err != null && typeof err === 'object' && 'code' in err && err.code === 'ER_DUP_ENTRY'
      if (!isDuplicate) throw err
    }
    // Always SELECT after insert — $returningId() is unreliable with this driver
    const [newRow] = await db
      .select({ id: assessNpsSubmissions.id, assessLink: assessNpsSubmissions.assessLink })
      .from(assessNpsSubmissions)
      .where(and(eq(assessNpsSubmissions.npsFormId, formId), eq(assessNpsSubmissions.userId, userId)))
      .orderBy(desc(assessNpsSubmissions.id))
      .limit(1)
    if (!newRow) throw new Error('ASSESS_SUBMISSION_CREATE_FAILED')
    if (newRow.assessLink) return { url: newRow.assessLink, completed: false }
    submissionId = newRow.id
  }

  // Fetch user email for the API call
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.email) throw new Error('USER_EMAIL_NOT_FOUND')

  // Call Assess Platform to generate link
  const platformUrl = process.env['ASSESS_PLATFORM_URL']
  const authToken = process.env['ASSESS_PLATFORM_AUTH_TOKEN']
  const appBaseUrl = (process.env['VITE_NEW_STUDENT_UI_URL'] ?? 'https://df21-180-151-45-54.ngrok-free.app').replace(/\/$/, '')
  const callbackUrl = `${appBaseUrl}/api/assess-nps-callback`
  const assessRedirectURI = process.env['ASSESS_REDIRECT_URI']

  console.log('[assess-link] callbackUrl being sent to Assess:', callbackUrl)

  const apiRes = await fetch(`${platformUrl}/student/assessments/generate-test`, {
    method: 'POST',
    headers: {
      'adminauthtoken': authToken ?? '',
      'clientid': form.clientId ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uniqueID: String(submissionId),
      assessmentTemplateId: form.templateId ?? '',
      redirectClientUrl: assessRedirectURI,
      email: user.email,
      client_id: form.clientId ?? '',
      callback_url: callbackUrl,
      noTimeBound: true,
    }),
  })

  if (!apiRes.ok) throw new Error(`ASSESS_API_ERROR:${apiRes.status}`)

  const apiData = await apiRes.json() as { url?: string; [key: string]: unknown }
  const url = apiData.url
  if (!url) throw new Error('ASSESS_API_NO_URL')

  // Persist link and full API response in assess_callback
  await db
    .update(assessNpsSubmissions)
    .set({ assessLink: url, assessCallback: JSON.stringify(apiData), updatedAt: nowMysql() })
    .where(eq(assessNpsSubmissions.id, submissionId))

  return { url, completed: false }
}
