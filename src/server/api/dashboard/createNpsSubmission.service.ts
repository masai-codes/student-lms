import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { npsForms, npsQuestionResponses, npsSubmissions } from '@/db/schema'

export interface ExistingResponse {
  questionId: number
  response: unknown
}

export interface NpsSubmissionResult {
  submissionId: number
  status: 'DRAFT' | 'SUBMITTED'
  existingResponses: Array<ExistingResponse>
}

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function createNpsSubmission(
  formId: number,
  userId: number,
): Promise<NpsSubmissionResult> {
  const [form] = await db
    .select({ id: npsForms.id, allowMultipleAttempts: npsForms.allowMultipleAttempts })
    .from(npsForms)
    .where(and(eq(npsForms.id, formId), isNull(npsForms.deletedAt), eq(npsForms.isActive, 1)))
    .limit(1)

  if (!form) throw new Error('NPS_FORM_NOT_FOUND')

  // Return existing DRAFT if present
  const [draftRow] = await db
    .select({ id: npsSubmissions.id })
    .from(npsSubmissions)
    .where(
      and(
        eq(npsSubmissions.npsFormId, formId),
        eq(npsSubmissions.userId, userId),
        eq(npsSubmissions.status, 'DRAFT'),
        isNull(npsSubmissions.deletedAt),
      ),
    )
    .limit(1)

  if (draftRow) {
    return {
      submissionId: draftRow.id,
      status: 'DRAFT',
      existingResponses: await fetchResponses(draftRow.id),
    }
  }

  // If multiple attempts not allowed, return existing SUBMITTED row
  if (!form.allowMultipleAttempts) {
    const [submittedRow] = await db
      .select({ id: npsSubmissions.id })
      .from(npsSubmissions)
      .where(
        and(
          eq(npsSubmissions.npsFormId, formId),
          eq(npsSubmissions.userId, userId),
          eq(npsSubmissions.status, 'SUBMITTED'),
          isNull(npsSubmissions.deletedAt),
        ),
      )
      .limit(1)

    if (submittedRow) {
      return {
        submissionId: submittedRow.id,
        status: 'SUBMITTED',
        existingResponses: await fetchResponses(submittedRow.id),
      }
    }
  }

  // Compute next attempt number
  const [lastAttempt] = await db
    .select({ attemptNumber: npsSubmissions.attemptNumber })
    .from(npsSubmissions)
    .where(and(eq(npsSubmissions.npsFormId, formId), eq(npsSubmissions.userId, userId)))
    .orderBy(desc(npsSubmissions.attemptNumber))
    .limit(1)

  const nextAttempt = lastAttempt ? lastAttempt.attemptNumber + 1 : 1
  const now = nowMysql()

  try {
    await db.insert(npsSubmissions).values({
      npsFormId: formId,
      userId,
      attemptNumber: nextAttempt,
      status: 'DRAFT',
      isLocked: 0,
      startedAt: now,
      updatedAt: now,
    })
  } catch (err) {
    // Two concurrent requests (e.g. React Strict Mode double-invoke) can race on
    // the same (npsFormId, userId, attemptNumber) unique key. If that happens,
    // fall through and select the row the other request just inserted.
    const isDuplicate =
      err != null && typeof err === 'object' && 'code' in err && err.code === 'ER_DUP_ENTRY'
    if (!isDuplicate) throw err
  }

  const [newRow] = await db
    .select({ id: npsSubmissions.id })
    .from(npsSubmissions)
    .where(
      and(
        eq(npsSubmissions.npsFormId, formId),
        eq(npsSubmissions.userId, userId),
        eq(npsSubmissions.attemptNumber, nextAttempt),
        isNull(npsSubmissions.deletedAt),
      ),
    )
    .limit(1)

  if (!newRow) throw new Error('NPS_SUBMISSION_CREATE_FAILED')

  return { submissionId: newRow.id, status: 'DRAFT', existingResponses: [] }
}

async function fetchResponses(submissionId: number): Promise<Array<ExistingResponse>> {
  const rows = await db
    .select({ questionId: npsQuestionResponses.npsQuestionId, response: npsQuestionResponses.response })
    .from(npsQuestionResponses)
    .where(eq(npsQuestionResponses.npsSubmissionId, submissionId))
  return rows
}
