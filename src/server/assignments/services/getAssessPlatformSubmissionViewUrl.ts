import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, submissions } from '@/db/schema'

function readJsonObject(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export async function getAssessPlatformSubmissionViewUrlForUser(input: {
  userId: number
  submissionId: number
}): Promise<string> {
  const assessBase = process.env.ASSESS_PLATFORM_URL?.trim().replace(/\/$/, '')
  const adminAuthToken = process.env.ASSESS_PLATFORM_AUTH_TOKEN?.trim()

  if (!assessBase || !adminAuthToken) {
    throw new Error('ASSESS_PLATFORM_NOT_CONFIGURED')
  }

  const rows = await db
    .select({
      submissionData: submissions.data,
      assignmentId: submissions.assignmentId,
      allowPractice: assignments.allowPractice,
      settings: assignments.settings,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(
      and(
        eq(submissions.id, input.submissionId),
        eq(submissions.userId, input.userId),
        isNull(submissions.deletedAt),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUBMISSION_NOT_FOUND')
  }

  const row = rows[0]
  const submissionData = readJsonObject(row.submissionData)
  const link =
    typeof submissionData?.assess_platform_link === 'string'
      ? submissionData.assess_platform_link
      : null

  if (!link) {
    throw new Error('ASSESS_PLATFORM_LINK_MISSING')
  }

  const assignmentSettings = readJsonObject(row.settings)
  const clientId =
    typeof assignmentSettings?.assess_platform_client_id === 'string'
      ? assignmentSettings.assess_platform_client_id
      : null

  if (!clientId) {
    throw new Error('ASSESS_PLATFORM_CLIENT_ID_MISSING')
  }

  const token = new URL(link).searchParams.get('token')
  if (!token) {
    throw new Error('ASSESS_PLATFORM_TOKEN_MISSING')
  }

  const practiceQuery = row.allowPractice === 1 ? '&allowAttempt=true' : ''
  const headers = {
    adminauthtoken: adminAuthToken,
    clientId,
    'Content-Type': 'application/json; charset=utf-8',
  }

  const reportResponse = await fetch(
    `${assessBase}/single-assignment-users/report?token=${token}${practiceQuery}`,
    { method: 'GET', headers },
  )

  if (!reportResponse.ok) {
    throw new Error('ASSESS_PLATFORM_REPORT_FAILED')
  }

  const reportJson = (await reportResponse.json()) as {
    data?: { singleAssessmentUser?: { reportToken?: string } }
  }
  const reportToken = reportJson.data?.singleAssessmentUser?.reportToken

  if (!reportToken) {
    throw new Error('ASSESS_PLATFORM_REPORT_TOKEN_MISSING')
  }

  const viewResponse = await fetch(
    `${assessBase}/student/submissions/get-submission-view-url?reportToken=${reportToken}${practiceQuery}`,
    { method: 'GET', headers },
  )

  if (!viewResponse.ok) {
    throw new Error('ASSESS_PLATFORM_VIEW_URL_FAILED')
  }

  const viewJson = (await viewResponse.json()) as { url?: string }
  if (!viewJson.url) {
    throw new Error('ASSESS_PLATFORM_VIEW_URL_MISSING')
  }

  return viewJson.url
}
