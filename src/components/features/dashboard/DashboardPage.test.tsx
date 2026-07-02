// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'

const hoisted = vi.hoisted(() => ({ fetchOverview: vi.fn() }))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  fetchDashboardOverview: hoisted.fetchOverview,
}))

beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver =
    NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  it('renders the static sections and API-driven welcome banner + announcements', async () => {
    hoisted.fetchOverview.mockResolvedValueOnce({
      banners: [
        { id: 7, title: 'Live referral banner', description: 'From the API', imageUrl: null, ctaUrl: null },
      ],
      announcements: [
        { id: 3, source: 'm', title: 'Personal notice', body: '', authorName: 'Prof. Anvesh', isForYou: true, ctaName: null, ctaLink: null },
      ],
    })

    renderPage()

    // Static sections still render immediately.
    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText('Announcements')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Take Photo' })).toBeTruthy()

    // The API banner + announcement replace the mock once the query resolves.
    await waitFor(() => expect(screen.getByText('Live referral banner')).toBeTruthy())
    expect(screen.getByText('Personal notice')).toBeTruthy()
    expect(screen.getByTestId('dashboard-announcement-for-you')).toBeTruthy()
  })

  it('falls back to mock banners before the query resolves', () => {
    hoisted.fetchOverview.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/Be the friend who brings opportunities/)).toBeTruthy()
  })

  it('exposes stable data-testid hooks for automation', () => {
    hoisted.fetchOverview.mockReturnValue(new Promise(() => {}))
    renderPage()
    for (const testId of [
      'dashboard-root',
      'dashboard-profile-action-banner',
      'dashboard-welcome-section',
      'dashboard-schedule-section',
      'dashboard-sidebar',
      'dashboard-announcements-panel',
      'dashboard-product-updates-panel',
      'dashboard-lms-support-panel',
    ]) {
      expect(screen.getByTestId(testId)).toBeTruthy()
    }
  })
})
