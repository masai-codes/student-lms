import {
  fetchAchievements,
  fetchEmailPreferences,
  fetchProfileCertificates,
  fetchProfileInvoices,
  fetchProfileOverview,
  fetchProfileSessions,
  fetchStudentKit,
  fetchUndertakings,
} from '@/lib/api/profile/profileApi'

/** Profile data changes rarely within a visit; long enough to avoid tab-flap refetches. */
const PROFILE_STALE_TIME = 2 * 60 * 1000

export const PROFILE_QUERY_KEYS = {
  overview: ['profile', 'overview'] as const,
  sessions: ['profile', 'sessions'] as const,
  emailPreferences: ['profile', 'email-preferences'] as const,
  undertakings: ['profile', 'undertakings'] as const,
  achievements: ['profile', 'achievements'] as const,
  certificates: ['profile', 'certificates'] as const,
  studentKit: ['profile', 'student-kit'] as const,
  invoices: ['profile', 'invoices'] as const,
}

export const profileOverviewQuery = () => ({
  queryKey: PROFILE_QUERY_KEYS.overview,
  queryFn: fetchProfileOverview,
  staleTime: PROFILE_STALE_TIME,
})

export const profileAchievementsQuery = () => ({
  queryKey: PROFILE_QUERY_KEYS.achievements,
  queryFn: fetchAchievements,
  staleTime: PROFILE_STALE_TIME,
})

/**
 * Tab-scoped queries. Each is `enabled` only while its tab is open so opening
 * the profile page costs one request, not eight — the old page's lazy fetching
 * for kit/invoices, applied consistently.
 */
export const profileSessionsQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.sessions,
  queryFn: fetchProfileSessions,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})

export const profileEmailPreferencesQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.emailPreferences,
  queryFn: fetchEmailPreferences,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})

export const profileUndertakingsQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.undertakings,
  queryFn: fetchUndertakings,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})

export const profileCertificatesQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.certificates,
  queryFn: fetchProfileCertificates,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})

export const profileStudentKitQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.studentKit,
  queryFn: fetchStudentKit,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})

export const profileInvoicesQuery = (enabled: boolean) => ({
  queryKey: PROFILE_QUERY_KEYS.invoices,
  queryFn: fetchProfileInvoices,
  staleTime: PROFILE_STALE_TIME,
  enabled,
})
