import { eq, sql } from 'drizzle-orm'
import { getAgreementRenderData } from './agreement/getAgreementRenderData.service'
import type { AgreementSection } from './agreement/getAgreementRenderData.service'
import { toStudentKitStatus } from './t0/getStudentKitStatus.service'
import type { StudentKitStatus } from './t0/getStudentKitStatus.service'
import { getT0AdmissionsStatus } from './t0/getT0AdmissionsStatus.service'
import { expandLectures } from './lectureExpansion'
import type { LectureRow, T0FlowLectureItem } from './lectureExpansion'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import type { GuidedTourPlatform } from './t0/guidedTourProgress'
import { db } from '@/db'
import { users } from '@/db/schema'
import { toEmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { portalHasIdCard } from '@/utils/portalCapabilities'

export type { T0FlowLectureItem } from './lectureExpansion'

export interface T0FlowLecturesResult {
  lmsLectures: Array<T0FlowLectureItem>
  programLectures: Array<T0FlowLectureItem>
  completedLectureIds: Array<number>
  /** Full agreement render detail per eligible section (steps, prefill, status). */
  legalAgreementSections: Array<AgreementSection>
  /** Show the Upload Document step — decided solely by the admissions API. */
  isDocumentsRequired: boolean
  /** Whether documents have been uploaded/submitted (drives the step's green check). */
  documentsUploaded: boolean
  /** Student-kit status (applicability + fill/tracking state) from the admissions API. */
  studentKit: StudentKitStatus
  /**
   * Whether the student's client issues an LMS ID card at all — false for IIT
   * Jodhpur, which hides the capstone entirely (locked *and* unlocked states).
   */
  idCardApplicable: boolean
  idCardUrl: string | null
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/**
 * Whether this student gets the ID-card capstone, keyed off `users.client` (not
 * the request domain — IITJ students reach the Masai domain through the mobile
 * app). Missing user → treated as Masai, matching `toEmailPortal`'s default.
 */
async function isIdCardApplicable(userId: number): Promise<boolean> {
  const rows = await db
    .select({ client: users.client })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return portalHasIdCard(toEmailPortal(rows[0]?.client))
}

async function getLecturesForSection(
  sectionId: number,
): Promise<Array<T0FlowLectureItem>> {
  const rows = normalizeRows<LectureRow>(
    await db.execute(sql`
      SELECT id, title, type, videos, zoom_link
      FROM lectures
      WHERE section_id = ${sectionId}
        AND deleted_at IS NULL
        AND type IN ('live', 'recorded', 'scrum', 'video', 'interactive-video')
      ORDER BY schedule DESC
      LIMIT 100
    `),
  )
  return expandLectures(rows)
}

async function getSectionId(
  batchId: number,
  sectionType: string,
): Promise<number | null> {
  const rows = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM sections
      WHERE batch_id = ${batchId}
        AND type = ${sectionType}
        AND active = 1
        AND deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `),
  )
  return rows[0]?.id ?? null
}

export async function getT0FlowLectures(
  userId: number,
  batchId?: number,
  platform: GuidedTourPlatform = 'web',
): Promise<T0FlowLecturesResult> {
  const emptyKit: StudentKitStatus = {
    applicable: false,
    detailsFilled: false,
    trackingUrl: null,
    trackingId: null,
    admissionsFormUrl: null,
  }
  const empty: T0FlowLecturesResult = {
    lmsLectures: [],
    programLectures: [],
    completedLectureIds: [],
    legalAgreementSections: [],
    isDocumentsRequired: false,
    documentsUploaded: false,
    studentKit: emptyKit,
    idCardApplicable: false,
    idCardUrl: null,
  }

  if (!batchId) return empty
  const admissionRows = normalizeRows<{ batch_id: number }>(
    await db.execute(sql`
      SELECT batch_id FROM user_batch_admission_data
      WHERE user_id = ${userId} AND batch_id = ${batchId}
      LIMIT 1
    `),
  )

  // Non-T0 (lite) flow: no admission row, but enrolled users get the trimmed
  // 3-step tour. Only the agreement (Program Onboarding) needs render data —
  // the LMS steps (photo, app) are user-level and come from the status payload.
  // No videos / documents / student kit / ID card.
  if (!admissionRows.length) {
    const enrolledBatchIds = await getBatchIdsForEnrolledUser(userId)
    if (!enrolledBatchIds.includes(batchId)) return empty
    const legalAgreementSections = await getAgreementRenderData(userId, batchId)
    return { ...empty, legalAgreementSections }
  }

  // Documents / student kit / ID card are decided solely by the admissions API
  // (single call, write-through persisted to our columns).
  const [
    lmsSectionId,
    programSectionId,
    legalAgreementSections,
    admissionsStatus,
    idCardApplicable,
  ] = await Promise.all([
    getSectionId(batchId, `lms-walkthrough-${platform}`),
    getSectionId(batchId, `program-onboarding-${platform}`),
    getAgreementRenderData(userId, batchId),
    getT0AdmissionsStatus(userId, batchId),
    isIdCardApplicable(userId),
  ])
  const isDocumentsRequired = admissionsStatus.documentsRequired
  const documentsUploaded = admissionsStatus.documentsUploaded
  const studentKit = toStudentKitStatus(admissionsStatus)
  // Clients without an LMS ID card (IITJ) never get a URL either — nothing
  // downstream can render a card it shouldn't have.
  const idCardUrl = idCardApplicable ? admissionsStatus.idCardUrl : null
  console.log('[student-status] getT0FlowLectures applied admissions status', {
    userId,
    batchId,
    isDocumentsRequired,
    documentsUploaded,
    kitApplicable: studentKit.applicable,
    idCardApplicable,
    idCardUrl,
  })

  const [lmsLectures, programLectures] = await Promise.all([
    lmsSectionId ? getLecturesForSection(lmsSectionId) : Promise.resolve([]),
    programSectionId
      ? getLecturesForSection(programSectionId)
      : Promise.resolve([]),
  ])

  const allLectureIds = [
    ...new Set([
      ...lmsLectures.map((l) => l.lectureId),
      ...programLectures.map((l) => l.lectureId),
    ]),
  ]

  let completedLectureIds: Array<number> = []
  if (allLectureIds.length > 0) {
    const idList = allLectureIds.join(', ')
    const rows = normalizeRows<{ lecture_id: number }>(
      await db.execute(sql`
        SELECT DISTINCT lecture_id FROM video_attendances
        WHERE user_id = ${userId}
          AND lecture_id IN (${sql.raw(idList)})
          AND duration >= 10
      `),
    )
    completedLectureIds = rows.map((r) => Number(r.lecture_id))
  }

  return {
    lmsLectures,
    programLectures,
    completedLectureIds,
    legalAgreementSections,
    isDocumentsRequired,
    documentsUploaded,
    studentKit,
    idCardApplicable,
    idCardUrl,
  }
}
