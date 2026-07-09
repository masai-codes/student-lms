/**
 * External Admissions API client (segregated here so the rest of the app stays
 * decoupled from it). It is the sole source of truth for the T0 document /
 * student-kit / ID-card steps.
 *
 * `GET {ADMISSIONS_API_BASE_URL}/lms/student-status?student_code=…&include=…`
 * with an `x-api-key` header. The endpoint replies `{ success, data }`; this
 * unwraps `data`. Never throws — returns `null` when the API is unconfigured,
 * unreachable, or errors, so callers degrade gracefully.
 */

export interface AdmissionsDocumentsStatus {
  /** Whether this cohort requires document upload at all (drives step visibility). */
  required?: boolean
  instituteSideUpload?: boolean
  documentsUploaded?: boolean
  documentsVerified?: boolean
  documentsPendingVerification?: boolean
}

export interface AdmissionsKitTracking {
  trackingId?: string | null
  trackingUrl?: string | null
  serviceProvider?: string | null
}

export interface AdmissionsKitStatus {
  /** Whether this student is due a welcome kit (drives step visibility). */
  showKit?: boolean
  welcomeKitUrl?: string | null
  detailsFilled?: boolean
  tracking?: AdmissionsKitTracking | null
}

export interface AdmissionsIdCard {
  url?: string | null
}

export interface AdmissionsStudentStatus {
  documents?: AdmissionsDocumentsStatus
  kit?: AdmissionsKitStatus
  idCard?: AdmissionsIdCard
  [key: string]: unknown
}

/** The three sections the T0 flow relies on. */
const DEFAULT_INCLUDE = 'documents,kit,id_card'

export async function getAdmissionsStudentStatus(
  studentCode: string,
  include = DEFAULT_INCLUDE,
): Promise<AdmissionsStudentStatus | null> {
  const baseUrl = process.env.ADMISSIONS_API_BASE_URL?.trim().replace(/\/$/, '')
  const apiKey = process.env.ADMISSIONS_API_KEY?.trim()
  if (!baseUrl || !apiKey || !studentCode) return null

  const url = `${baseUrl}/lms/student-status?student_code=${encodeURIComponent(studentCode)}&include=${encodeURIComponent(include)}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    // The endpoint wraps its payload as `{ success, data }`; return `data`.
    const json = (await res.json()) as {
      success?: boolean
      data?: AdmissionsStudentStatus
    }
    if (json && json.success && json.data) return json.data
    return null
  } catch {
    return null
  }
}
