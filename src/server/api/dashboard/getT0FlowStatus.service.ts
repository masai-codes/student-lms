import { and, eq, inArray, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { batches, profiles, userDeviceTokens } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

export interface BatchT0Status {
  batchId: number
  batchName: string
  showProgramTab: boolean
}

export interface T0FlowStatus {
  showT0Flow: boolean
  batches: Array<BatchT0Status>
  profilePhotoUrl: string | null
  downloadAppCompleted: boolean
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

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

async function getProfilePhotoUrl(userId: number): Promise<string | null> {
  const rows = await db
    .select({ meta: profiles.meta })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const meta = parseMeta(rows[0]?.meta)
  const pic = meta['profile_pic']
  if (!pic || typeof pic !== 'string' || pic.trim() === '') return null
  try {
    const url = new URL(pic.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function getT0FlowStatus(userId: number): Promise<T0FlowStatus> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  const empty = { showT0Flow: false, batches: [], profilePhotoUrl: null, downloadAppCompleted: false }
  if (batchIds.length === 0) return empty

  const batchIdList = batchIds.join(', ')

  const [admissionRows, batchRows, profilePhotoUrl, deviceTokenRows] = await Promise.all([
    normalizeRows<{ batch_id: number; full_fees_paid: number | boolean }>(
      await db.execute(sql`
        SELECT batch_id, full_fees_paid
        FROM user_batch_admission_data
        WHERE user_id = ${userId}
          AND batch_id IN (${sql.raw(batchIdList)})
        ORDER BY batch_id ASC
      `)
    ),
    db.select({ id: batches.id, name: batches.name })
      .from(batches)
      .where(inArray(batches.id, batchIds)),
    getProfilePhotoUrl(userId),
    db.select({ id: userDeviceTokens.id }).from(userDeviceTokens).where(eq(userDeviceTokens.userId, userId)).limit(1),
  ])

  if (admissionRows.length === 0) return empty

  const batchNameMap = new Map(batchRows.map((b) => [b.id, b.name]))

  const batchStatuses: Array<BatchT0Status> = admissionRows.map((row) => ({
    batchId: Number(row.batch_id),
    batchName: batchNameMap.get(Number(row.batch_id)) ?? String(row.batch_id),
    showProgramTab: Boolean(row.full_fees_paid),
  }))

  return {
    showT0Flow: true,
    batches: batchStatuses,
    profilePhotoUrl,
    downloadAppCompleted: deviceTokenRows.length > 0,
  }
}
