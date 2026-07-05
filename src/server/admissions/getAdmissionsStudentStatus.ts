/**
 * External Admissions API client (segregated here so the rest of the app stays
 * decoupled from it). Fetches a student's onboarding status — currently used for
 * document upload/verification, which the LMS does not itself store.
 *
 * `GET {ADMISSIONS_API_BASE_URL}/lms/student-status?student_code=…&include=…`
 * with an `x-api-key` header. Never throws — returns `null` when the API is
 * unconfigured, unreachable, or errors, so callers degrade gracefully.
 */

export interface AdmissionsDocumentsStatus {
  required?: boolean
  documentsUploaded?: boolean
  documentsVerified?: boolean
}

export interface AdmissionsStudentStatus {
  documents?: AdmissionsDocumentsStatus
  [key: string]: unknown
}

export async function getAdmissionsStudentStatus(
  studentCode: string,
  include = 'documents',
): Promise<AdmissionsStudentStatus | null> {
  const baseUrl = process.env.ADMISSIONS_API_BASE_URL?.trim().replace(/\/$/, '')
  const apiKey = process.env.ADMISSIONS_API_KEY?.trim()
  if (!baseUrl || !apiKey || !studentCode) return null

  const url = `${baseUrl}/lms/student-status?student_code=${encodeURIComponent(studentCode)}&include=${encodeURIComponent(include)}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    console.log('url', url)
    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: controller.signal,
    })
    console.log('res', res)
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as AdmissionsStudentStatus
  } catch {
    return null
  }
}
