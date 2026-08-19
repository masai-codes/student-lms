/** Every `/api/profile/**` path in one place, so callers never hand-build URLs. */
export const PROFILE_API = {
  overview: '/api/profile',
  password: '/api/profile/password',
  sessions: '/api/profile/sessions',
  session: (sessionId: string) =>
    `/api/profile/sessions/${encodeURIComponent(sessionId)}`,
  emailPreferences: '/api/profile/email-preferences',
  undertakings: '/api/profile/undertakings',
  acceptUndertaking: (sectionId: number) =>
    `/api/profile/undertakings/${sectionId}/accept`,
  achievements: '/api/profile/achievements',
  certificates: '/api/profile/certificates',
  studentKit: '/api/profile/student-kit',
  invoices: '/api/profile/invoices',
} as const
