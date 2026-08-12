// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileTabContent } from './ProfileTabContent'
import { PROFILE_TABS } from './profileTabsConfig'
import type { ProfileTab } from './profileTabsConfig'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

/** Each tab is stubbed so this test covers only the switch, not their internals. */
function stub(testId: string) {
  return () => <div data-testid={testId} />
}

vi.mock('./details/ProfileDetailsTab', () => ({
  ProfileDetailsTab: stub('stub-details'),
}))
vi.mock('./activity/AccountActivityTab', () => ({
  AccountActivityTab: stub('stub-activity'),
}))
vi.mock('./email-preferences/EmailPreferencesTab', () => ({
  EmailPreferencesTab: stub('stub-email-preferences'),
}))
vi.mock('./undertakings/UndertakingsTab', () => ({
  UndertakingsTab: stub('stub-undertakings'),
}))
vi.mock('./certificates/CertificatesTab', () => ({
  CertificatesTab: stub('stub-certificates'),
}))
vi.mock('./invoices/InvoicesTab', () => ({ InvoicesTab: stub('stub-invoices') }))
vi.mock('./student-kit/StudentKitTab', () => ({
  StudentKitTab: stub('stub-student-kit'),
}))

const PROFILE: ProfileOverview = {
  name: 'Riya',
  email: 'riya@example.com',
  avatarUrl: null,
  phone: null,
  studentCodes: [],
  isNewUserJourney: true,
  hasFullFees: true,
}

afterEach(cleanup)

describe('ProfileTabContent', () => {
  it.each(PROFILE_TABS)('renders only the %s tab', (tab) => {
    render(<ProfileTabContent activeTab={tab} profile={PROFILE} />)

    expect(screen.getByTestId(`stub-${tab}`)).toBeTruthy()
    for (const other of PROFILE_TABS.filter(
      (candidate: ProfileTab) => candidate !== tab,
    )) {
      expect(screen.queryByTestId(`stub-${other}`)).toBeNull()
    }
  })
})
