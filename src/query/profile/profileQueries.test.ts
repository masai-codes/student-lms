import { describe, expect, it, vi } from 'vitest'
import {
  PROFILE_QUERY_KEYS,
  profileAchievementsQuery,
  profileCertificatesQuery,
  profileEmailPreferencesQuery,
  profileInvoicesQuery,
  profileOverviewQuery,
  profileSessionsQuery,
  profileStudentKitQuery,
  profileUndertakingsQuery,
} from '@/query/profile/profileQueries'

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileOverview: vi.fn(),
  fetchProfileSessions: vi.fn(),
  fetchEmailPreferences: vi.fn(),
  fetchUndertakings: vi.fn(),
  fetchAchievements: vi.fn(),
  fetchProfileCertificates: vi.fn(),
  fetchStudentKit: vi.fn(),
  fetchProfileInvoices: vi.fn(),
}))

/** Every tab-scoped factory, so the gating rule is asserted for all of them. */
const TAB_SCOPED = [
  ['sessions', profileSessionsQuery, PROFILE_QUERY_KEYS.sessions],
  [
    'email preferences',
    profileEmailPreferencesQuery,
    PROFILE_QUERY_KEYS.emailPreferences,
  ],
  ['undertakings', profileUndertakingsQuery, PROFILE_QUERY_KEYS.undertakings],
  ['certificates', profileCertificatesQuery, PROFILE_QUERY_KEYS.certificates],
  ['student kit', profileStudentKitQuery, PROFILE_QUERY_KEYS.studentKit],
  ['invoices', profileInvoicesQuery, PROFILE_QUERY_KEYS.invoices],
] as const

describe('PROFILE_QUERY_KEYS', () => {
  it('namespaces every key under "profile" and keeps them distinct', () => {
    const keys = Object.values(PROFILE_QUERY_KEYS)
    for (const key of keys) expect(key[0]).toBe('profile')
    expect(new Set(keys.map((key) => key.join('/'))).size).toBe(keys.length)
  })
})

describe('always-on queries', () => {
  it('the overview and achievements queries carry no enabled gate', () => {
    for (const options of [
      profileOverviewQuery(),
      profileAchievementsQuery(),
    ]) {
      expect(options.queryFn).toBeTypeOf('function')
      expect(options.staleTime).toBeGreaterThan(0)
      expect('enabled' in options).toBe(false)
    }
  })
})

describe('tab-scoped queries', () => {
  it.each(TAB_SCOPED)(
    'the %s query only fires while its tab is open',
    (_label, factory, expectedKey) => {
      expect(factory(false).enabled).toBe(false)
      const enabled = factory(true)
      expect(enabled.enabled).toBe(true)
      expect(enabled.queryKey).toEqual(expectedKey)
      expect(enabled.queryFn).toBeTypeOf('function')
      expect(enabled.staleTime).toBeGreaterThan(0)
    },
  )
})
