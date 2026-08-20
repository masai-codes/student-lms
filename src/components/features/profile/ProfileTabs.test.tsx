// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileTabs } from './ProfileTabs'
import { resolveProfileTabs } from './profileTabsConfig'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

const TABS = resolveProfileTabs({
  name: 'Riya',
  email: 'riya@example.com',
  avatarUrl: null,
  phone: null,
  studentCodes: [],
  isNewUserJourney: true,
  hasFullFees: true,
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfileTabs', () => {
  it('renders every available tab inside a tablist', () => {
    render(<ProfileTabs tabs={TABS} activeTab="details" onSelect={vi.fn()} />)

    const tablist = screen.getByTestId('profile-tablist')
    expect(tablist.getAttribute('role')).toBe('tablist')
    expect(screen.getAllByRole('tab')).toHaveLength(TABS.length)
    expect(screen.getByTestId('profile-tab-student-kit')).toBeTruthy()
    expect(screen.getByTestId('profile-tab-invoices')).toBeTruthy()
  })

  it('marks only the active tab as selected', () => {
    render(<ProfileTabs tabs={TABS} activeTab="activity" onSelect={vi.fn()} />)

    expect(
      screen.getByTestId('profile-tab-activity').getAttribute('aria-selected'),
    ).toBe('true')
    expect(
      screen.getByTestId('profile-tab-details').getAttribute('aria-selected'),
    ).toBe('false')
  })

  it('selects a tab and records the click', () => {
    const onSelect = vi.fn()
    render(<ProfileTabs tabs={TABS} activeTab="details" onSelect={onSelect} />)

    fireEvent.click(screen.getByTestId('profile-tab-certificates'))
    expect(onSelect).toHaveBeenCalledWith('certificates')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith('l_profile_tab_click', {
      tab: 'certificates',
    })
  })

  it('uses the renamed Acknowledgements label', () => {
    render(<ProfileTabs tabs={TABS} activeTab="details" onSelect={vi.fn()} />)
    expect(
      screen.getByTestId('profile-tab-undertakings').textContent,
    ).toContain('Acknowledgements')
  })

  it('caps the stagger delay so long tab rows stay snappy', () => {
    render(<ProfileTabs tabs={TABS} activeTab="details" onSelect={vi.fn()} />)

    const last = screen.getByTestId('profile-tab-email-preferences')
    const delay = last.style.getPropertyValue('--dash-delay')
    expect(Number.parseFloat(delay)).toBeLessThanOrEqual(0.32)
  })

  it('renders nothing but the rail when there are no tabs', () => {
    render(<ProfileTabs tabs={[]} activeTab="details" onSelect={vi.fn()} />)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(screen.getByTestId('profile-tablist')).toBeTruthy()
  })
})
