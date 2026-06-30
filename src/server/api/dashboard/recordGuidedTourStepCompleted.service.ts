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

function hasValidAgreementSubKey(agreementsJson: Record<string, unknown>): boolean {
  const RESERVED = new Set(['shouldModalBeVisible'])
  return Object.entries(agreementsJson).some(([key, value]) => {
    if (RESERVED.has(key)) return false
    const entry = value as Record<string, unknown> | null | undefined
    if (!entry || typeof entry !== 'object') return false
    const pdfUrl = entry['pdfUrl']
    const heading = entry['heading']
    const hidePolicy = entry['hidePolicy']
    return (
      typeof pdfUrl === 'string' && pdfUrl.trim() !== '' &&
      typeof heading === 'string' && heading.trim() !== '' &&
      hidePolicy !== true && hidePolicy !== 'true'
    )
  })
}

async function updateProgressMeta(
  userId: number,
  admissionBatchId: number,
): Promise<void> {
  // Read admission row (full_fees_paid + existing meta) and profile (meta + legal_data) in parallel
  interface AdmRow { full_fees_paid: number | boolean; meta: unknown }
  interface ProfileRow { meta: unknown; legal_data: unknown }

  const [admRows, profileRows, tokenRows] = await Promise.all([
    normalizeRows<AdmRow>(
      await db.execute(sql`
        SELECT full_fees_paid, meta FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id = ${admissionBatchId}
        LIMIT 1
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
  const metaUpdate: Record<string, string> = {}

  // ── LMS extra steps ──────────────────────────────────────────────────────────
  const profileMeta = parseMeta(profileRows[0]?.meta)
  const pic = profileMeta['profile_pic']
  const hasProfilePhoto = typeof pic === 'string' && pic.trim().length > 0 &&
    (() => { try { const u = new URL(pic.trim()); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } })()
  const hasDevice = tokenRows.length > 0
  const lmsExtraCompleted = (hasProfilePhoto ? 1 : 0) + (hasDevice ? 1 : 0)

  // ── LMS web fraction ─────────────────────────────────────────────────────────
  const lmsSectionRows = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM sections
      WHERE batch_id = ${admissionBatchId}
        AND type = 'lms-walkthrough-web'
        AND active = 1 AND deleted_at IS NULL
      ORDER BY id DESC LIMIT 1
    `)
  )
  const lmsWebId = lmsSectionRows[0]?.id
  if (lmsWebId) {
    const { total, completed } = await countSectionCompletions(userId, lmsWebId)
    const denom = total + LMS_WALKTHROUGH_EXTRA_STEPS
    const numer = Math.min(completed + lmsExtraCompleted, denom)
    const newWebFrac = `${numer}/${denom}`
    metaUpdate['lms_walkthrough_web'] = newWebFrac

    // Aggregate = MAX(new web, existing app fraction already in meta)
    const existingAppFrac = existingMeta['lms_walkthrough_app'] as string | undefined
    metaUpdate['lms_walkthrough'] = fracValue(newWebFrac) >= fracValue(existingAppFrac)
      ? newWebFrac
      : (existingAppFrac ?? newWebFrac)
  }

  // ── Program fraction (only when full_fees_paid) ───────────────────────────────
  if (Boolean(admRows[0].full_fees_paid)) {
    // Find which enrolled sections for this user/batch have a valid agreement
    const enrolledSectionRows = normalizeRows<{ id: number; agreements: string | null }>(
      await db.execute(sql`
        SELECT s.id, s.settings->>'$.agreements' AS agreements
        FROM section_user su
        JOIN sections s ON s.id = su.section_id
        WHERE su.user_id = ${userId}
          AND su.deleted_at IS NULL
          AND s.batch_id = ${admissionBatchId}
          AND s.active = 1
          AND s.deleted_at IS NULL
          AND s.settings->>'$.agreements.shouldModalBeVisible' = 'true'
      `)
    )

    let hasAgreement = false
    let agreementSectionId: number | null = null
    for (const row of enrolledSectionRows) {
      let agreementsJson: Record<string, unknown> | null = null
      try { agreementsJson = (typeof row.agreements === 'string' ? JSON.parse(row.agreements) : row.agreements) as Record<string, unknown> | null } catch { continue }
      if (agreementsJson && hasValidAgreementSubKey(agreementsJson)) {
        hasAgreement = true
        agreementSectionId = Number(row.id)
        break
      }
    }

    // Check if user has signed the agreement for the specific section
    let agreementDone = 0
    if (hasAgreement && agreementSectionId) {
      const legalData = (parseMeta(profileRows[0]?.legal_data)['agreements'] ?? {}) as Record<string, unknown>
      const sectionAgreement = legalData[`section_${agreementSectionId}`] as Record<string, unknown> | undefined
      agreementDone = sectionAgreement?.['haveAcceptedLegalAgreement'] === true ? 1 : 0
    }

    const progSectionRows = normalizeRows<{ id: number }>(
      await db.execute(sql`
        SELECT id FROM sections
        WHERE batch_id = ${admissionBatchId}
          AND type = 'program-onboarding-web'
          AND active = 1 AND deleted_at IS NULL
        ORDER BY id DESC LIMIT 1
      `)
    )
    const progWebId = progSectionRows[0]?.id
    if (progWebId) {
      const { total, completed } = await countSectionCompletions(userId, progWebId)
      const denom = total + (hasAgreement ? 1 : 0)
      const numer = Math.min(completed + agreementDone, denom)
      const newWebFrac = `${numer}/${denom}`
      metaUpdate['program_onboarding_web'] = newWebFrac

      // Aggregate = MAX(new web, existing app fraction already in meta)
      const existingAppFrac = existingMeta['program_onboarding_app'] as string | undefined
      metaUpdate['program_onboarding'] = fracValue(newWebFrac) >= fracValue(existingAppFrac)
        ? newWebFrac
        : (existingAppFrac ?? newWebFrac)
    }
  }

  if (!Object.keys(metaUpdate).length) return

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
  await updateProgressMeta(userId, input.batchId)
}
