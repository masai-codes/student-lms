import { sql } from 'drizzle-orm'
import { db } from '@/db'

export interface DocumentStatus {
  documentsUploaded: boolean
  admissionsUrl: string
}

export interface KitTracking {
  trackingId: string | null
  trackingUrl: string | null
}

export interface KitStatus {
  detailsFilled: boolean
  tracking: KitTracking | null
  admissionsUrl: string
}

export interface T0FlowStudentStatusResult {
  documents: DocumentStatus | null
  kit: KitStatus | null
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

function parseTracking(raw: unknown): KitTracking | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Record<string, unknown>
  const trackingId = (t['trackingId'] ?? t['tracking_id'] ?? t['id'] ?? null) as string | null
  const trackingUrl = (t['trackingUrl'] ?? t['tracking_url'] ?? t['url'] ?? null) as string | null
  if (!trackingId && !trackingUrl) return null
  return { trackingId: trackingId ?? null, trackingUrl: trackingUrl ?? null }
}

export async function getT0FlowStudentStatus(
  userId: number,
  _batchId: number,
): Promise<T0FlowStudentStatusResult> {
  const empty: T0FlowStudentStatusResult = { documents: null, kit: null }

  const baseUrl = process.env['ADMISSIONS_BASE_URL']
  const apiKey = process.env['ADMISSIONS_API_KEY']
  const ssoUrl = process.env['ADMISSIONS_SSO_BASE_URL'] ?? baseUrl ?? ''
  if (!baseUrl || !apiKey) return empty

  // Get student code (username) for this user
  const userRows = normalizeRows<{ username: string | null }>(
    await db.execute(sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1`)
  )
  const studentCode = userRows[0]?.username
  if (!studentCode) return empty

  const apiUrl = `${baseUrl.replace(/\/$/, '')}/lms/student-status?student_code=${encodeURIComponent(studentCode)}&include=documents,kit`

  let apiData: Record<string, unknown> | null = null
  try {
    const res = await fetch(apiUrl, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const json = await res.json() as { success: boolean; data: Record<string, unknown> }
      if (json.success) apiData = json.data
    }
  } catch {
    return empty
  }

  if (!apiData) return empty

  const admissionsUrl = ssoUrl.replace(/\/$/, '')

  // Documents
  let documents: DocumentStatus | null = null
  const docsRaw = apiData['documents'] as Record<string, unknown> | undefined
  if (docsRaw) {
    documents = {
      documentsUploaded: Boolean(docsRaw['documentsUploaded']),
      admissionsUrl,
    }
  }

  // Kit
  let kit: KitStatus | null = null
  const kitRaw = apiData['kit'] as Record<string, unknown> | undefined
  if (kitRaw) {
    kit = {
      detailsFilled: Boolean(kitRaw['detailsFilled']),
      tracking: parseTracking(kitRaw['tracking']),
      admissionsUrl: String(kitRaw['welcomeKitUrl'] ?? admissionsUrl),
    }
  }

  return { documents, kit }
}
