import { sql } from 'drizzle-orm'
import { computeGuidedTourProgress, fracValue } from './t0/guidedTourProgress'
import type { GuidedTourPlatform } from './t0/guidedTourProgress'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

/** The platform a section belongs to, from its `-web` / `-app` type suffix. */
function platformFromSectionType(sectionType: string): GuidedTourPlatform {
  return sectionType.endsWith('-app') ? 'app' : 'web'
}

export interface RecordGuidedTourStepInput {
  lectureId: number
  batchId: number
  tab: 'lms' | 'program'
  watchedSeconds: number
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

async function upsertVideoAttendance(
  userId: number,
  lectureId: number,
  sectionId: number,
  batchId: number,
  watchedSeconds: number,
): Promise<void> {
  const safeSeconds = Number.isFinite(watchedSeconds) ? watchedSeconds : 0
  const intervals = JSON.stringify([{ start: 0, end: Math.round(safeSeconds) }])

  const existing = normalizeRows<{ id: number; totalDuration: number | null }>(
    await db.execute(sql`
      SELECT id, totalDuration FROM video_attendances
      WHERE lecture_id = ${lectureId} AND user_id = ${userId}
      ORDER BY id DESC LIMIT 1
    `)
  )

  if (existing.length > 0) {
    const newTotalDuration = Math.max(existing[0].totalDuration ?? 0, safeSeconds)
    await db.execute(sql`
      UPDATE video_attendances
      SET duration = 100, status = 1, intervals = ${intervals}, totalDuration = ${newTotalDuration}, updated_at = NOW()
      WHERE id = ${existing[0].id}
    `)
  } else {
    await db.execute(sql`
      INSERT INTO video_attendances
        (lecture_id, user_id, host_id, category, duration, batch_id, section_id, type, status, schedule, intervals, totalDuration, created_at, updated_at)
      VALUES
        (${lectureId}, ${userId}, ${userId}, 'guided-tour', 100, ${batchId}, ${sectionId}, 'video', 1, NOW(), ${intervals}, ${safeSeconds}, NOW(), NOW())
    `)
  }
}

async function syncSibling(
  userId: number,
  lectureTitle: string,
  siblingType: string,
  enrolledBatchIds: Array<number>,
  admissionBatchId: number,
  watchedSeconds: number,
): Promise<void> {
  const batchIdList = enrolledBatchIds.join(', ')
  const siblingRows = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM sections
      WHERE batch_id IN (${sql.raw(batchIdList)})
        AND type = ${siblingType}
        AND active = 1
        AND deleted_at IS NULL
      ORDER BY batch_id DESC, id ASC
      LIMIT 1
    `)
  )
  if (!siblingRows.length) return
  const siblingSectionId = siblingRows[0].id

  const siblingLecs = normalizeRows<{ id: number; title: string }>(
    await db.execute(sql`
      SELECT id, title FROM lectures
      WHERE section_id = ${siblingSectionId} AND deleted_at IS NULL
      LIMIT 100
    `)
  )

  const normalizedTitle = normalizeTitle(lectureTitle)
  const match = siblingLecs.find((r) => normalizeTitle(r.title) === normalizedTitle)
  if (match) {
    await upsertVideoAttendance(userId, match.id, siblingSectionId, admissionBatchId, watchedSeconds)
  }
}

/**
 * Recomputes the walkthrough fractions for the batch on the platform of the
 * lecture that was just completed and stores them in
 * `user_batch_admission_data.meta`. The live fraction is written to
 * `lms_walkthrough_{platform}` / `program_onboarding_{platform}`; the aggregate
 * keys (`lms_walkthrough`, `program_onboarding`) are `MAX(this platform, stored
 * other platform)` so cross-platform progress is preserved.
 */
async function updateProgressMeta(
  userId: number,
  batchId: number,
  platform: GuidedTourPlatform,
): Promise<void> {
  interface AdmRow { full_fees_paid: number | boolean; meta: unknown }
  interface ProfileRow { meta: unknown; legal_data: unknown }

  const [admRows, profileRows, tokenRows] = await Promise.all([
    normalizeRows<AdmRow>(
      await db.execute(sql`
        SELECT full_fees_paid, meta FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id = ${batchId} LIMIT 1
      `)
    ),
    normalizeRows<ProfileRow>(
      await db.execute(sql`
        SELECT meta, legal_data FROM profiles
        WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
      `)
    ),
    normalizeRows<{ id: number }>(
      await db.execute(sql`SELECT id FROM user_device_tokens WHERE user_id = ${userId} LIMIT 1`)
    ),
  ])

  if (!admRows.length) return

  const existingMeta = parseMeta(admRows[0].meta)
  const fullFeesPaid = Boolean(admRows[0].full_fees_paid)

  const other: GuidedTourPlatform = platform === 'web' ? 'app' : 'web'
  const { lms, program } = await computeGuidedTourProgress(
    userId,
    batchId,
    fullFeesPaid,
    profileRows[0]?.meta,
    profileRows[0]?.legal_data,
    tokenRows.length > 0,
    platform,
  )

  const metaUpdate: Record<string, string> = {}

  const lmsFrac = `${lms.completed}/${lms.total}`
  metaUpdate[`lms_walkthrough_${platform}`] = lmsFrac
  const lmsOtherFrac = existingMeta[`lms_walkthrough_${other}`] as string | undefined
  metaUpdate['lms_walkthrough'] = fracValue(lmsFrac) >= fracValue(lmsOtherFrac) ? lmsFrac : (lmsOtherFrac ?? lmsFrac)

  if (program) {
    const progFrac = `${program.completed}/${program.total}`
    metaUpdate[`program_onboarding_${platform}`] = progFrac
    const progOtherFrac = existingMeta[`program_onboarding_${other}`] as string | undefined
    metaUpdate['program_onboarding'] = fracValue(progFrac) >= fracValue(progOtherFrac) ? progFrac : (progOtherFrac ?? progFrac)
  }

  const merged = { ...existingMeta, ...metaUpdate }
  await db.execute(sql`
    UPDATE user_batch_admission_data
    SET meta = ${JSON.stringify(merged)}
    WHERE user_id = ${userId} AND batch_id = ${batchId}
  `)
}

export async function recordGuidedTourStepCompleted(
  userId: number,
  input: RecordGuidedTourStepInput,
): Promise<void> {
  const enrolledBatchIds = await getBatchIdsForEnrolledUser(userId)
  if (!enrolledBatchIds.length) return

  interface LectureInfo { id: number; title: string; section_id: number; section_type: string }
  const lectureRows = normalizeRows<LectureInfo>(
    await db.execute(sql`
      SELECT l.id, l.title, l.section_id, s.type AS section_type
      FROM lectures l
      JOIN sections s ON s.id = l.section_id
      WHERE l.id = ${input.lectureId} AND l.deleted_at IS NULL
      LIMIT 1
    `)
  )
  if (!lectureRows.length) return
  const lecture = lectureRows[0]

  await upsertVideoAttendance(userId, input.lectureId, lecture.section_id, input.batchId, input.watchedSeconds)

  const siblingTypeMap: Record<string, string> = {
    'lms-walkthrough-web': 'lms-walkthrough-app',
    'lms-walkthrough-app': 'lms-walkthrough-web',
    'program-onboarding-web': 'program-onboarding-app',
    'program-onboarding-app': 'program-onboarding-web',
  }
  const siblingType = siblingTypeMap[lecture.section_type]
  if (siblingType) {
    await syncSibling(userId, lecture.title, siblingType, enrolledBatchIds, input.batchId, input.watchedSeconds)
  }

  // Store progress against the platform of the section the lecture belongs to.
  await updateProgressMeta(userId, input.batchId, platformFromSectionType(lecture.section_type))
}
