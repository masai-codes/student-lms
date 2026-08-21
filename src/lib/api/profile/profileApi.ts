import { fetchJson } from '@/lib/api/fetchJson'
import { PROFILE_API } from '@/lib/api/profile/profilePaths'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'
import type {
  AchievementItem,
  EmailPreferences,
  PendingUndertaking,
  ProfileInvoice,
  ProfileOverview,
  ProfileSession,
  StudentKitStatus,
} from '@/server/api/profile/profile.types'

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function fetchProfileOverview(): Promise<ProfileOverview> {
  const { profile } = await fetchJson<{ profile: ProfileOverview }>(
    PROFILE_API.overview,
  )
  return profile
}

export interface UpdateProfilePayload {
  name?: string
  secondaryMobile?: string
}

export async function updateProfileRequest(
  payload: UpdateProfilePayload,
): Promise<{ name: string; phone: string | null }> {
  return fetchJson(PROFILE_API.overview, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export async function updatePasswordRequest(payload: {
  currentPassword: string
  newPassword: string
}): Promise<{ updated: boolean }> {
  return fetchJson(PROFILE_API.password, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export async function fetchProfileSessions(): Promise<Array<ProfileSession>> {
  const { sessions } = await fetchJson<{ sessions: Array<ProfileSession> }>(
    PROFILE_API.sessions,
  )
  return sessions
}

export async function revokeSessionRequest(
  sessionId: string,
): Promise<{ revoked: boolean }> {
  return fetchJson(PROFILE_API.session(sessionId), { method: 'DELETE' })
}

export async function revokeOtherSessionsRequest(): Promise<{
  revokedCount: number
}> {
  return fetchJson(PROFILE_API.sessions, { method: 'DELETE' })
}

export async function fetchEmailPreferences(): Promise<EmailPreferences> {
  const { preferences } = await fetchJson<{ preferences: EmailPreferences }>(
    PROFILE_API.emailPreferences,
  )
  return preferences
}

export async function updateEmailPreferencesRequest(
  patch: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  const { preferences } = await fetchJson<{ preferences: EmailPreferences }>(
    PROFILE_API.emailPreferences,
    { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(patch) },
  )
  return preferences
}

export async function fetchUndertakings(): Promise<Array<PendingUndertaking>> {
  const { undertakings } = await fetchJson<{
    undertakings: Array<PendingUndertaking>
  }>(PROFILE_API.undertakings)
  return undertakings
}

export async function acceptUndertakingRequest(payload: {
  sectionId: number
  location: string
  ipAddress: string
}): Promise<{ accepted: boolean }> {
  const { sectionId, ...body } = payload
  return fetchJson(PROFILE_API.acceptUndertaking(sectionId), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  })
}

export interface AchievementsResponse {
  achievements: Array<AchievementItem>
  /** Base for `<base>/badge/<shareKey>`; null when sharing is unconfigured. */
  shareBaseUrl: string | null
}

export async function fetchAchievements(): Promise<AchievementsResponse> {
  return fetchJson<AchievementsResponse>(PROFILE_API.achievements)
}

export async function fetchProfileCertificates(): Promise<
  Array<CertificateItem>
> {
  const { certificates } = await fetchJson<{
    certificates: Array<CertificateItem>
  }>(PROFILE_API.certificates)
  return certificates
}

export async function fetchStudentKit(): Promise<StudentKitStatus> {
  const { kit } = await fetchJson<{ kit: StudentKitStatus }>(
    PROFILE_API.studentKit,
  )
  return kit
}

export async function fetchProfileInvoices(): Promise<Array<ProfileInvoice>> {
  const { invoices } = await fetchJson<{ invoices: Array<ProfileInvoice> }>(
    PROFILE_API.invoices,
  )
  return invoices
}
