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

interface AdmissionsDocumentsStatus {
  /** Whether this cohort requires document upload at all (drives step visibility). */
  required?: boolean
  instituteSideUpload?: boolean
  documentsUploaded?: boolean
  documentsVerified?: boolean
  documentsPendingVerification?: boolean
}

interface AdmissionsKitTracking {
  trackingId?: string | null
  trackingUrl?: string | null
  serviceProvider?: string | null
}

interface AdmissionsKitStatus {
  /** Whether this student is due a welcome kit (drives step visibility). */
  showKit?: boolean
  welcomeKitUrl?: string | null
  detailsFilled?: boolean
  tracking?: AdmissionsKitTracking | null
}

interface AdmissionsIdCard {
  url?: string | null
}

/** One settled fee payment, with its downloadable invoice when generated. */
export interface AdmissionsInvoice {
  paymentType?: string | null
  amount?: number | string | null
  paidOn?: string | null
  invoiceUrl?: string | null
}

export interface AdmissionsStudentStatus {
  documents?: AdmissionsDocumentsStatus
  kit?: AdmissionsKitStatus
  idCard?: AdmissionsIdCard
  invoices?: Array<AdmissionsInvoice>
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

  console.log('[student-status] getAdmissionsStudentStatus called', {
    studentCode,
    include,
    hasBaseUrl: Boolean(baseUrl),
    hasApiKey: Boolean(apiKey),
  })
  if (!baseUrl || !apiKey || !studentCode) {
    console.log('[student-status] SKIPPING call — missing config', {
      hasBaseUrl: Boolean(baseUrl),
      hasApiKey: Boolean(apiKey),
      hasStudentCode: Boolean(studentCode),
    })
    return null
  }

  const url = `${baseUrl}/lms/student-status?student_code=${encodeURIComponent(studentCode)}&include=${encodeURIComponent(include)}`
  console.log('[student-status] fetching', url)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    console.log('[student-status] response received', {
      status: res.status,
      ok: res.ok,
    })
    if (!res.ok) {
      console.log('[student-status] non-ok response — returning null', {
        status: res.status,
      })
      return null
    }
    // The endpoint wraps its payload as `{ success, data }`; return `data`.
    const json = (await res.json()) as {
      success?: boolean
      data?: AdmissionsStudentStatus
    }

    console.log('[student-status] parsed payload', {
      success: json?.success,
      hasData: Boolean(json?.data),
      data: json?.data,
    })
    if (json && json.success && json.data) return json.data
    console.log('[student-status] payload not usable — returning null')
    return null
  } catch (error) {
    console.error('[student-status] fetch threw — returning null', error)
    return null
  }
}
