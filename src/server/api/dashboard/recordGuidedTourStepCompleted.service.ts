import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

const LMS_WALKTHROUGH_EXTRA_STEPS = 2

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
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

function fracValue(f: string | undefined): number {
  if (!f) return 0
  const parts = f.split('/')
  const n = Number(parts[0])
  const d = Number(parts[1])
  return d > 0 ? n / d : 0
}

async function upsertVideoAttendance(
  userId: number,
  lectureId: number,
  sectionId: number,
  batchId: number,
  watchedSeconds: number,
  _hasVimeoEmbed: boolean,
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
  _lectureSectionId: number,
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

  interface TitleRow { id: number; title: string; vimeo_player_embed_url: string | null }
  const siblingLecs = normalizeRows<TitleRow>(
    await db.execute(sql`
      SELECT id, title, vimeo_player_embed_url FROM lectures
      WHERE section_id = ${siblingSectionId} AND deleted_at IS NULL
      LIMIT 100
    `)
  )

  const normalizedTitle = normalizeTitle(lectureTitle)
  const match = siblingLecs.find((r) => normalizeTitle(r.title) === normalizedTitle)
  if (match) {
    await upsertVideoAttendance(userId, match.id, siblingSectionId, admissionBatchId, watchedSeconds, Boolean(match.vimeo_player_embed_url))
  }
}

async function countSectionCompletions(
  userId: number,
  sectionId: number,
): Promise<{ total: number; completed: number }> {
  const lecs = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM lectures
      WHERE section_id = ${sectionId}
        AND deleted_at IS NULL
        AND type IN ('live', 'recorded', 'scrum', 'video', 'interactive-video')
      LIMIT 200
    `)
  )
  if (!lecs.length) return { total: 0, completed: 0 }

  const idList = lecs.map((l) => l.id).join(', ')
  const done = normalizeRows<{ lecture_id: number }>(
    await db.execute(sql`
      SELECT DISTINCT lecture_id FROM video_attendances
      WHERE user_id = ${userId}
        AND lecture_id IN (${sql.raw(idList)})
        AND duration >= 10
    `)
  )
  return { total: lecs.length, completed: done.length }
}

async function updateProgressMeta(
  userId: number,
  admissionBatchId: number,
  enrolledBatchIds: Array<number>,
): Promise<void> {
  const batchIdList = enrolledBatchIds.join(', ')

  // Find first section of each relevant type
  interface SectionRow { id: number; type: string }
  const sectionRows = normalizeRows<SectionRow>(
    await db.execute(sql`
      SELECT id, type FROM sections
      WHERE batch_id IN (${sql.raw(batchIdList)})
        AND type IN ('lms-walkthrough-web', 'lms-walkthrough-app', 'program-onboarding-web', 'program-onboarding-app')
        AND active = 1
        AND deleted_at IS NULL
      ORDER BY batch_id DESC, id ASC
    `)
  )

  const sectionByType: Record<string, number> = {}
  for (const row of sectionRows) {
    if (!sectionByType[row.type]) sectionByType[row.type] = row.id
  }

  // Extra steps completion
  interface ProfileRow { meta: unknown }
  const profileRows = normalizeRows<ProfileRow>(
    await db.execute(sql`
      SELECT meta FROM profiles WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
    `)
  )
  const profileMeta = parseMeta(profileRows[0]?.meta)
  const pic = profileMeta['profile_pic']
  const hasProfilePhoto = typeof pic === 'string' && pic.trim().length > 0 &&
    (() => { try { const u = new URL(pic.trim()); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } })()

  const tokenRows = normalizeRows<{ id: number }>(
    await db.execute(sql`SELECT id FROM user_device_tokens WHERE user_id = ${userId} LIMIT 1`)
  )
  const hasDevice = tokenRows.length > 0
  const lmsExtraCompleted = (hasProfilePhoto ? 1 : 0) + (hasDevice ? 1 : 0)

  const metaUpdate: Record<string, string> = {}

  // LMS web fraction
  const lmsWebId = sectionByType['lms-walkthrough-web']
  if (lmsWebId) {
    const { total, completed } = await countSectionCompletions(userId, lmsWebId)
    const denom = total + LMS_WALKTHROUGH_EXTRA_STEPS
    metaUpdate['lms_walkthrough_web'] = `${completed + lmsExtraCompleted}/${denom}`
  }

  // LMS app fraction
  const lmsAppId = sectionByType['lms-walkthrough-app']
  if (lmsAppId) {
    const { total, completed } = await countSectionCompletions(userId, lmsAppId)
    const denom = total + LMS_WALKTHROUGH_EXTRA_STEPS
    metaUpdate['lms_walkthrough_app'] = `${completed + lmsExtraCompleted}/${denom}`
  }

  // lms_walkthrough = max of web/app
  const bestLms =
    fracValue(metaUpdate['lms_walkthrough_web']) >= fracValue(metaUpdate['lms_walkthrough_app'])
      ? (metaUpdate['lms_walkthrough_web'] ?? metaUpdate['lms_walkthrough_app'])
      : (metaUpdate['lms_walkthrough_app'] ?? metaUpdate['lms_walkthrough_web'])
  if (bestLms) metaUpdate['lms_walkthrough'] = bestLms

  // Read admission row for full_fees_paid + existing meta
  interface AdmRow { full_fees_paid: number | boolean; meta: unknown }
  const admRows = normalizeRows<AdmRow>(
    await db.execute(sql`
      SELECT full_fees_paid, meta FROM user_batch_admission_data
      WHERE user_id = ${userId} AND batch_id = ${admissionBatchId}
      LIMIT 1
    `)
  )

  if (admRows.length && Boolean(admRows[0].full_fees_paid)) {
    // Check for legal sections (sections with shouldModalBeVisible = true in enrolled batches)
    const legalRows = normalizeRows<{ id: number }>(
      await db.execute(sql`
        SELECT id FROM sections
        WHERE batch_id IN (${sql.raw(batchIdList)})
          AND active = 1
          AND deleted_at IS NULL
          AND JSON_EXTRACT(settings, '$.agreements.shouldModalBeVisible') = 'true'
        LIMIT 1
      `)
    )
    const hasLegal = legalRows.length > 0

    // Check if user has completed legal agreements (no pending sections)
    let legalDone = 0
    if (hasLegal) {
      interface LegalRow { legal_data: unknown }
      const legalProfileRows = normalizeRows<LegalRow>(
        await db.execute(sql`
          SELECT legal_data FROM profiles WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
        `)
      )
      const legalData = parseMeta(legalProfileRows[0]?.legal_data)
      const agreements = legalData['agreements']
      // If user has signed any agreement, count legal as done (simplified check)
      legalDone = agreements && typeof agreements === 'object' && Object.keys(agreements as object).length > 0 ? 1 : 0
    }

    const progWebId = sectionByType['program-onboarding-web']
    if (progWebId) {
      const { total, completed } = await countSectionCompletions(userId, progWebId)
      const denom = total + (hasLegal ? 1 : 0)
      const numer = completed + legalDone
      const fraction = `${numer}/${denom}`
      metaUpdate['program_onboarding_web'] = fraction
      metaUpdate['program_onboarding_app'] = fraction
      metaUpdate['program_onboarding'] = fraction
    }
  }

  if (!Object.keys(metaUpdate).length) return

  const existingMeta = admRows.length ? parseMeta(admRows[0].meta) : {}
  const merged = { ...existingMeta, ...metaUpdate }

  await db.execute(sql`
    UPDATE user_batch_admission_data
    SET meta = ${JSON.stringify(merged)}
    WHERE user_id = ${userId} AND batch_id = ${admissionBatchId}
  `)
}

export async function recordGuidedTourStepCompleted(
  userId: number,
  input: RecordGuidedTourStepInput,
): Promise<void> {
  const enrolledBatchIds = await getBatchIdsForEnrolledUser(userId)
  if (!enrolledBatchIds.length) return

  // Get lecture info
  interface LectureInfo { id: number; title: string; section_id: number; section_type: string; vimeo_player_embed_url: string | null }
  const lectureRows = normalizeRows<LectureInfo>(
    await db.execute(sql`
      SELECT l.id, l.title, l.section_id, l.vimeo_player_embed_url, s.type AS section_type
      FROM lectures l
      JOIN sections s ON s.id = l.section_id
      WHERE l.id = ${input.lectureId} AND l.deleted_at IS NULL
      LIMIT 1
    `)
  )
  if (!lectureRows.length) return
  const lecture = lectureRows[0]
  const hasVimeoEmbed = Boolean(lecture.vimeo_player_embed_url)

  // Write video_attendance for this lecture
  await upsertVideoAttendance(userId, input.lectureId, lecture.section_id, input.batchId, input.watchedSeconds, hasVimeoEmbed)

  // Cross-platform sibling sync
  const siblingTypeMap: Record<string, string> = {
    'lms-walkthrough-web': 'lms-walkthrough-app',
    'lms-walkthrough-app': 'lms-walkthrough-web',
    'program-onboarding-web': 'program-onboarding-app',
    'program-onboarding-app': 'program-onboarding-web',
  }
  const siblingType = siblingTypeMap[lecture.section_type]
  if (siblingType) {
    await syncSibling(
      userId,
      lecture.section_id,
      lecture.title,
      siblingType,
      enrolledBatchIds,
      input.batchId,
      input.watchedSeconds,
    )
  }

  // Recount and update meta
  await updateProgressMeta(userId, input.batchId, enrolledBatchIds)
}
