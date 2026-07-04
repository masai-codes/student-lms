import { sql } from 'drizzle-orm'
import { getAgreementRenderData } from './agreement/getAgreementRenderData.service'
import type { AgreementSection } from './agreement/getAgreementRenderData.service'
import { db } from '@/db'

export interface T0FlowLectureItem {
  id: string
  lectureId: number
  title: string
  videoUrl: string | null
  lectureType: string
}

export interface T0FlowLecturesResult {
  lmsLectures: Array<T0FlowLectureItem>
  programLectures: Array<T0FlowLectureItem>
  completedLectureIds: Array<number>
  /** Full agreement render detail per eligible section (steps, prefill, status). */
  legalAgreementSections: Array<AgreementSection>
  isDocumentsRequired: boolean
  isStudentKitApplicable: boolean
  idCardUrl: string | null
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

    if (urls.length > 0) {
      items.push({
        id: String(row.id),
        lectureId: row.id,
        title: row.title,
        videoUrl: urls[0],
        lectureType: row.type,
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

async function getBatchInfoFlags(batchId: number): Promise<{ isDocumentsRequired: boolean; isStudentKitApplicable: boolean }> {
  const rows = normalizeRows<{ item: string; value: string | null }>(
    await db.execute(sql`
      SELECT item, value FROM batch_info
      WHERE batch_id = ${batchId}
        AND item IN ('Documents required', 'Is Student Kit applicable?')
    `)
  )
  let isDocumentsRequired = false
  let isStudentKitApplicable = false
  for (const row of rows) {
    if (row.item === 'Documents required') {
      isDocumentsRequired = row.value != null && String(row.value).trim() !== ''
    } else if (row.item === 'Is Student Kit applicable?') {
      isStudentKitApplicable = String(row.value ?? '').trim().toLowerCase() === 'true'
    }
  }
  return { isDocumentsRequired, isStudentKitApplicable }
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
  const empty = { lmsLectures: [], programLectures: [], completedLectureIds: [], legalAgreementSections: [], isDocumentsRequired: false, isStudentKitApplicable: false, idCardUrl: null }

  // Validate: user must have an admission row for the requested batch
  if (!batchId) return empty
  const admissionRows = normalizeRows<{ batch_id: number; id_card_url: string | null }>(
    await db.execute(sql`
      SELECT batch_id, id_card_url FROM user_batch_admission_data
      WHERE user_id = ${userId} AND batch_id = ${batchId}
      LIMIT 1
    `)
  )
  if (!admissionRows.length) return empty

  const rawIdCardUrl = admissionRows[0]?.id_card_url ?? null
  const idCardUrl = typeof rawIdCardUrl === 'string' && /^https?:\/\/.+/.test(rawIdCardUrl.trim()) ? rawIdCardUrl.trim() : null

  // Find the most recently created lms-walkthrough-web and program-onboarding-web section for this batch
  const [lmsSectionId, programSectionId, legalAgreementSections, batchInfoFlags] = await Promise.all([
    getSectionId(batchId, 'lms-walkthrough-web'),
    getSectionId(batchId, 'program-onboarding-web'),
    getAgreementRenderData(userId, batchId),
    getBatchInfoFlags(batchId),
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

  return { lmsLectures, programLectures, completedLectureIds, legalAgreementSections, ...batchInfoFlags, idCardUrl }
}
