import { fetchJson } from '@/lib/api/fetchJson'
import { PROFILE_API } from '@/lib/api/profilePaths'
import type { UserProfile } from '@/server/api/profile/getProfile.service'
import type { EmailPreferences } from '@/server/api/profile/emailPreferences.service'
import type { SessionInfo } from '@/server/api/profile/accountActivity.service'
import type { CertificateItem } from '@/server/api/profile/certificates.service'
import type { AchievementItem } from '@/server/api/profile/achievements.service'

export async function fetchProfile(): Promise<UserProfile> {
  const { profile } = await fetchJson<{ profile: UserProfile }>(
    PROFILE_API.profile,
  )
  return profile
}

export async function updateProfile(payload: {
  name?: string
  mobile?: string
}): Promise<UserProfile> {
  const { profile } = await fetchJson<{ profile: UserProfile }>(
    PROFILE_API.profile,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return profile
}

export async function changePassword(payload: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<void> {
  await fetchJson<{ success: boolean }>(PROFILE_API.profile, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchEmailPreferences(): Promise<EmailPreferences> {
  const { preferences } = await fetchJson<{ preferences: EmailPreferences }>(
    PROFILE_API.emailPreferences,
  )
  return preferences
}

export async function updateEmailPreferences(
  updates: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  const { preferences } = await fetchJson<{ preferences: EmailPreferences }>(
    PROFILE_API.emailPreferences,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
  )
  return preferences
}

export async function fetchAccountActivity(): Promise<{
  sessions: SessionInfo[]
  currentSessionId: string | null
}> {
  return fetchJson<{
    sessions: SessionInfo[]
    currentSessionId: string | null
  }>(PROFILE_API.accountActivity)
}

export async function signOutSession(sessionId: string): Promise<void> {
  await fetchJson<{ success: boolean }>(PROFILE_API.accountActivity, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

export async function signOutAllSessions(): Promise<void> {
  await fetchJson<{ success: boolean }>(PROFILE_API.accountActivitySignOutAll, {
    method: 'POST',
  })
}

export async function fetchCertificates(): Promise<Array<CertificateItem>> {
  const { certificates } = await fetchJson<{
    certificates: Array<CertificateItem>
  }>(PROFILE_API.certificates)
  return certificates
}

export async function fetchAchievements(): Promise<Array<AchievementItem>> {
  const { achievements } = await fetchJson<{
    achievements: Array<AchievementItem>
  }>(PROFILE_API.achievements)
  return achievements
}

export async function fetchNewLmsPagesPreference(): Promise<boolean> {
  const { enabled } = await fetchJson<{ enabled: boolean }>(
    PROFILE_API.newLmsPages,
  )
  return enabled
}

export async function setNewLmsPagesPreference(
  enabled: boolean,
): Promise<boolean> {
  const { enabled: updated } = await fetchJson<{ enabled: boolean }>(
    PROFILE_API.newLmsPages,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  )
  return updated
}
