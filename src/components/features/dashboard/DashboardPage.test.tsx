// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import type * as TanstackRouter from '@tanstack/react-router'

const hoisted = vi.hoisted(() => ({
  fetchOverview: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchWelcomeModalStatus: vi.fn(),
  dismissWelcomeModalApi: vi.fn(),
  fetchT0FlowStatus: vi.fn(),
}))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  fetchDashboardOverview: hoisted.fetchOverview,
  fetchWelcomeModalStatus: hoisted.fetchWelcomeModalStatus,
  dismissWelcomeModalApi: hoisted.dismissWelcomeModalApi,
  fetchT0FlowStatus: hoisted.fetchT0FlowStatus,
}))
vi.mock('@/lib/api/me/meApi', () => ({
  fetchCurrentUser: hoisted.fetchCurrentUser,
}))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    Link: ({ children, params, ...props }: Record<string, unknown>) => (
      <a {...props}>{children as React.ReactNode}</a>
    ),
    useNavigate: () => vi.fn(),
  }
})

beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.fetchCurrentUser.mockResolvedValue({ name: 'Suryakumar' })
  hoisted.fetchWelcomeModalStatus.mockResolvedValue({ showWelcomeModal: false })
  hoisted.fetchT0FlowStatus.mockResolvedValue({
    showT0Flow: false,
    batches: [],
    profilePhotoUrl: null,
    downloadAppCompleted: false,
    showGuidedTour: false,
  })
})

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

const overview = {
  banners: [
    { id: 7, title: 'Live referral banner', description: 'From the API', imageUrl: null, ctaUrl: '/refer', analyticsKey: 'referral' },
  ],
  announcements: [
    { id: 3, source: 'm', title: 'Personal notice', body: '', authorName: 'Prof. Anvesh', isForYou: true, ctaName: null, ctaLink: null },
  ],
  productUpdates: [{ id: 5, title: 'Fresh LMS update', imageUrl: null }],
  supportSession: {
    id: 8,
    title: 'Doubt-clearing session',
    schedule: '2026-07-02T15:00:00+05:30',
    concludes: '2026-07-02T16:00:00+05:30',
    zoomLink: 'https://zoom.us/j/support',
    status: 'live',
  },
}

describe('DashboardPage', () => {
  it('greets the user and renders the API-driven banner, announcements, updates + support', async () => {
    hoisted.fetchOverview.mockResolvedValueOnce(overview)
    renderPage()

    // Greeting comes from the `me` API.
    await waitFor(() =>
      expect(screen.getByTestId('dashboard-welcome-name').textContent).toContain('Suryakumar'),
    )

    await waitFor(() => expect(screen.getByText('Live referral banner')).toBeTruthy())
    expect(screen.getByText('Personal notice')).toBeTruthy()
    expect(screen.getByText('Fresh LMS update')).toBeTruthy()
    // Support card shows the fixed heading + a live "Join Now" (not the title).
    expect(screen.getByTestId('dashboard-lms-support-panel')).toBeTruthy()
    expect(screen.getByTestId('dashboard-support-session-join')).toBeTruthy()
  })

  it('shows per-card loading and hides the support/banner cards while loading', () => {
    hoisted.fetchOverview.mockReturnValue(new Promise(() => {}))
    renderPage()
    // Announcements + product-updates cards show their loading state.
    expect(screen.getByTestId('dashboard-announcements-panel-loading')).toBeTruthy()
    expect(screen.getByTestId('dashboard-product-updates-panel-loading')).toBeTruthy()
    // Banner + support cards are hidden while loading.
    expect(screen.queryByTestId('dashboard-welcome-banner-carousel')).toBeNull()
    expect(screen.queryByTestId('dashboard-lms-support-panel')).toBeNull()
  })

  it('exposes stable data-testid hooks for automation', () => {
    hoisted.fetchOverview.mockReturnValue(new Promise(() => {}))
    renderPage()
    for (const testId of [
      'dashboard-root',
      'dashboard-welcome-section',
      'dashboard-schedule-section',
      'dashboard-sidebar',
      'dashboard-announcements-panel',
      'dashboard-product-updates-panel',
    ]) {
      expect(screen.getByTestId(testId)).toBeTruthy()
    }
  })
})
