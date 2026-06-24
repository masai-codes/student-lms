import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, sectionUser } from '@/db/schema'

export interface T0FlowLectureItem {
  id: string
  lectureId: number
  title: string
  videoUrl: string | null
  lectureType: string
}

export interface LegalAgreementSection {
  sectionId: number
  name: string
  completed: boolean
}

export interface T0FlowLecturesResult {
  lmsLectures: Array<T0FlowLectureItem>
  programLectures: Array<T0FlowLectureItem>
  completedLectureIds: Array<number>
  legalAgreementSections: Array<LegalAgreementSection>
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

interface LectureRow {
  id: number
  title: string
  type: string
  videos: string | Array<string> | null
}

function expandLectures(rows: Array<LectureRow>): Array<T0FlowLectureItem> {
  const items: Array<T0FlowLectureItem> = []
  for (const row of rows) {
    let urls: Array<string> = []
    if (row.videos) {
      try {
        const parsed = typeof row.videos === 'string' ? JSON.parse(row.videos) : row.videos
        if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === 'string')
      } catch {
        // videos field not valid JSON — skip
      }
    }

    if (urls.length === 0) {
      // No video URL — skip this lecture entirely
    } else {
      urls.forEach((url, i) => {
        items.push({
          id: urls.length === 1 ? String(row.id) : `${row.id}-${i}`,
          lectureId: row.id,
          title: row.title,
          videoUrl: url,
          lectureType: row.type,
        })
      })
    }
  }
  return items
}

async function getLecturesForSection(sectionId: number): Promise<Array<T0FlowLectureItem>> {
  const rows = normalizeRows<LectureRow>(
    await db.execute(sql`
      SELECT id, title, type, videos
      FROM lectures
      WHERE section_id = ${sectionId}
        AND deleted_at IS NULL
        AND type IN ('live', 'recorded', 'scrum', 'video', 'interactive-video')
      ORDER BY schedule DESC
      LIMIT 100
    `)
  )
  return expandLectures(rows)
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

async function getLegalAgreementSections(userId: number, batchId: number): Promise<Array<LegalAgreementSection>> {
  // Get sections the user is enrolled in that belong to this batch
  const enrolledRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  const allSectionIds = [...new Set(enrolledRows.map((r) => r.sectionId))].filter(Number.isFinite)
  if (!allSectionIds.length) return []

  // Filter to sections in this batch that have shouldModalBeVisible = true
  const sectionRows = normalizeRows<{ id: number; name: string; agreements: string | null }>(
    await db.execute(sql`
      SELECT id, name, settings->>'$.agreements' AS agreements
      FROM sections
      WHERE id IN (${sql.raw(allSectionIds.join(', '))})
        AND batch_id = ${batchId}
        AND active = 1
        AND settings->>'$.agreements.shouldModalBeVisible' = 'true'
    `)
  )
  if (!sectionRows.length) return []

  // Check which ones the user has already accepted
  const profileRows = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = (profileRows[0]?.legalData ?? {}) as Record<string, unknown>
  const userAgreements = (legalData['agreements'] ?? {}) as Record<string, unknown>

  const result: Array<LegalAgreementSection> = []
  for (const row of sectionRows) {
    let agreementsJson: Record<string, unknown> | null = null
    try {
      agreementsJson = (typeof row.agreements === 'string' ? JSON.parse(row.agreements) : row.agreements) as Record<string, unknown> | null
    } catch { continue }
    if (!agreementsJson || !hasValidAgreementSubKey(agreementsJson)) continue

    const sectionKey = `section_${row.id}`
    const sectionAgreement = userAgreements[sectionKey] as Record<string, unknown> | undefined
    const completed = sectionAgreement?.['haveAcceptedLegalAgreement'] === true

    result.push({ sectionId: Number(row.id), name: String(row.name ?? ''), completed })
  }
  return result
}

async function getSectionId(batchId: number, sectionType: string): Promise<number | null> {
  const rows = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM sections
      WHERE batch_id = ${batchId}
        AND type = ${sectionType}
        AND active = 1
        AND deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `)
  )
  return rows[0]?.id ?? null
}

export async function getT0FlowLectures(userId: number, batchId?: number): Promise<T0FlowLecturesResult> {
  const empty = { lmsLectures: [], programLectures: [], completedLectureIds: [], legalAgreementSections: [] }

  // Validate: user must have an admission row for the requested batch
  if (!batchId) return empty
  const admissionRows = normalizeRows<{ batch_id: number }>(
    await db.execute(sql`
      SELECT batch_id FROM user_batch_admission_data
      WHERE user_id = ${userId} AND batch_id = ${batchId}
      LIMIT 1
    `)
  )
  if (!admissionRows.length) return empty

  // Find the most recently created lms-walkthrough-web and program-onboarding-web section for this batch
  const [lmsSectionId, programSectionId, legalAgreementSections] = await Promise.all([
    getSectionId(batchId, 'lms-walkthrough-web'),
    getSectionId(batchId, 'program-onboarding-web'),
    getLegalAgreementSections(userId, batchId),
  ])

  const [lmsLectures, programLectures] = await Promise.all([
    lmsSectionId ? getLecturesForSection(lmsSectionId) : Promise.resolve([]),
    programSectionId ? getLecturesForSection(programSectionId) : Promise.resolve([]),
  ])

  const allLectureIds = [...new Set([
    ...lmsLectures.map((l) => l.lectureId),
    ...programLectures.map((l) => l.lectureId),
  ])]

  let completedLectureIds: Array<number> = []
  if (allLectureIds.length > 0) {
    const idList = allLectureIds.join(', ')
    const rows = normalizeRows<{ lecture_id: number }>(
      await db.execute(sql`
        SELECT DISTINCT lecture_id FROM video_attendances
        WHERE user_id = ${userId}
          AND lecture_id IN (${sql.raw(idList)})
          AND duration >= 10
      `)
    )
    completedLectureIds = rows.map((r) => Number(r.lecture_id))
  }

  return { lmsLectures, programLectures, completedLectureIds, legalAgreementSections }
}
