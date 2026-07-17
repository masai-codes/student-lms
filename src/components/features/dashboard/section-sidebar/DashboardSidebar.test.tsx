// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardSidebar } from './DashboardSidebar'
import type { DashboardOverviewState } from '../shared/types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}))

afterEach(cleanup)

const overview: DashboardOverviewState = {
  isPending: false,
  isError: false,
  banners: [],
  announcements: [
    {
      id: 1,
      source: 'a',
      title: 'Notice',
      body: '',
      authorName: 'Prof',
      isForYou: false,
      ctaName: null,
      ctaLink: null,
    },
  ],
  productUpdates: [{ id: 1, title: 'Update', imageUrl: null }],
  supportSession: {
    id: 1,
    title: 'LMS Support Session',
    schedule: '2026-07-02T18:30:00+05:30',
    concludes: null,
    zoomLink: 'https://zoom.us/j/1',
    status: 'live',
  },
  schedule: [],
  pendingTasks: [],
  feePaymentBanners: [],
  batchStartBanners: [],
}

describe('DashboardSidebar', () => {
  it('composes the announcements, product-updates and support cards', () => {
    render(<DashboardSidebar overview={overview} />)
    expect(screen.getByTestId('dashboard-announcements-panel')).toBeTruthy()
    expect(screen.getByTestId('dashboard-product-updates-panel')).toBeTruthy()
    expect(screen.getByTestId('dashboard-lms-support-panel')).toBeTruthy()
  })

  it('hides the support card when there is no session', () => {
    render(
      <DashboardSidebar overview={{ ...overview, supportSession: null }} />,
    )
    expect(screen.queryByTestId('dashboard-lms-support-panel')).toBeNull()
  })
})
