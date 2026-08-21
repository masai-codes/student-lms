import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROFILE_TAB,
  resolveActiveProfileTab,
  resolveProfileTabs,
} from '@/components/features/profile/profileTabsConfig'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

function profile(overrides: Partial<ProfileOverview> = {}): ProfileOverview {
  return {
    name: 'Riya',
    email: 'riya@example.com',
    avatarUrl: null,
    phone: null,
    studentCodes: [],
    isNewUserJourney: false,
    hasFullFees: false,
    ...overrides,
  }
}

describe('resolveProfileTabs', () => {
  it('shows the five always-on tabs for a plain student', () => {
    expect(resolveProfileTabs(profile()).map((tab) => tab.id)).toEqual([
      'details',
      'undertakings',
      'activity',
      'certificates',
      'email-preferences',
    ])
  })

  it('adds My Invoices on the new user journey', () => {
    const ids = resolveProfileTabs(profile({ isNewUserJourney: true })).map(
      (tab) => tab.id,
    )
    expect(ids).toContain('invoices')
    expect(ids).not.toContain('student-kit')
  })

  it('adds Student Kit only with full fees AND the new user journey', () => {
    expect(
      resolveProfileTabs(profile({ hasFullFees: true })).map((t) => t.id),
    ).not.toContain('student-kit')

    expect(
      resolveProfileTabs(
        profile({ hasFullFees: true, isNewUserJourney: true }),
      ).map((t) => t.id),
    ).toContain('student-kit')
  })

  it('keeps Student Kit in its old position, second', () => {
    const ids = resolveProfileTabs(
      profile({ hasFullFees: true, isNewUserJourney: true }),
    ).map((tab) => tab.id)
    expect(ids[1]).toBe('student-kit')
  })

  it('always exposes Certificates (the old build-time flag is gone)', () => {
    expect(resolveProfileTabs(profile()).map((t) => t.id)).toContain(
      'certificates',
    )
  })

  it('hides every gated tab while the profile is still loading', () => {
    expect(resolveProfileTabs(undefined).map((tab) => tab.id)).toEqual([
      'details',
      'undertakings',
      'activity',
      'certificates',
      'email-preferences',
    ])
  })

  it('renames the old lowercase "acknowledgement" label', () => {
    const tab = resolveProfileTabs(profile()).find(
      (candidate) => candidate.id === 'undertakings',
    )
    expect(tab?.label).toBe('Acknowledgements')
  })
})

describe('resolveActiveProfileTab', () => {
  const tabs = resolveProfileTabs(profile())

  it('honours a requested tab that this student can see', () => {
    expect(resolveActiveProfileTab('activity', tabs)).toBe('activity')
  })

  it('falls back for an unknown tab', () => {
    expect(resolveActiveProfileTab('nonsense', tabs)).toBe('details')
  })

  it('falls back for a tab the student has lost access to', () => {
    // e.g. a bookmarked ?tab=invoices link for a non-new-journey student.
    expect(resolveActiveProfileTab('invoices', tabs)).toBe('details')
  })

  it('falls back when no tab is requested', () => {
    expect(resolveActiveProfileTab(undefined, tabs)).toBe('details')
  })

  it('falls back to the default when there are somehow no tabs', () => {
    expect(resolveActiveProfileTab('details', [])).toBe(DEFAULT_PROFILE_TAB)
  })
})
