// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import { AnnouncementsPage } from './AnnouncementsPage'
import { createEmptyAnnouncementFilters } from './announcementFilterConfig'

const hoisted = vi.hoisted(() => {
  const search: {
    q?: string
    page: number
    message?: boolean
    type?: Array<string>
    category?: Array<string>
    announcedBy?: Array<string>
    startDate?: string
  } = { page: 1 }
  return { fetchAnnouncements: vi.fn(), navigate: vi.fn(), search }
})

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  fetchAnnouncements: hoisted.fetchAnnouncements,
}))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    getRouteApi: () => ({ useSearch: () => hoisted.search }),
    useNavigate: () => hoisted.navigate,
    Link: ({ children, params, to, ...props }: Record<string, unknown>) => (
      <a data-to={String(to)} {...props}>
        {children as React.ReactNode}
      </a>
    ),
  }
})
vi.mock('./AnnouncementFilterDrawer', () => ({
  AnnouncementFilterDrawer: ({
    onApply,
  }: {
    onApply: (f: ReturnType<typeof createEmptyAnnouncementFilters>) => void
  }) => (
    <button
      data-testid="apply-filters"
      onClick={() =>
        onApply({
          ...createEmptyAnnouncementFilters(),
          types: ['critical'],
          announcedBy: ['42'],
        })
      }
    />
  ),
}))
vi.mock('./AnnouncementAppliedFilters', () => ({
  AnnouncementAppliedFilters: ({ onClearAll }: { onClearAll: () => void }) => (
    <button data-testid="chips-clear" onClick={onClearAll} />
  ),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.search = { page: 1 }
  hoisted.fetchAnnouncements.mockResolvedValue({
    announcements: [
      {
        id: '1',
        source: 'a',
        title: 'Welcome',
        authorName: 'Ada',
        createdAt: '2026-07-20T10:00:00.000Z',
        isForYou: false,
        type: 'info',
        isUnread: false,
      },
    ],
    total: 1,
  })
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AnnouncementsPage />
    </QueryClientProvider>,
  )
}

describe('AnnouncementsPage', () => {
  it('renders announcements from the query', async () => {
    renderPage()
    expect(await screen.findByText('Welcome')).toBeTruthy()
  })

  it('renders the empty state when nothing matches', async () => {
    hoisted.fetchAnnouncements.mockResolvedValue({
      announcements: [],
      total: 0,
    })
    renderPage()
    expect(await screen.findByTestId('announcements-empty')).toBeTruthy()
  })

  it('navigates with applied filter params (page reset to 1)', async () => {
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('apply-filters'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: expect.objectContaining({
        page: 1,
        type: ['critical'],
        announcedBy: ['42'],
      }),
    })
  })

  it('clears all filters via clear-all', async () => {
    hoisted.search = { page: 1, type: ['critical'], category: ['DSA'] }
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('chips-clear'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: { q: undefined, page: 1, message: undefined },
    })
  })

  it('preserves filters when toggling "Important for you"', async () => {
    hoisted.search = { page: 1, type: ['critical'] }
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('announcements-important-toggle'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: expect.objectContaining({ message: true, type: ['critical'] }),
    })
  })

  it('debounces search while preserving filters', async () => {
    vi.useFakeTimers()
    hoisted.search = { page: 1, type: ['critical'] }
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('Search Announcements'), {
      target: { value: 'exam' },
    })
    await act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: expect.objectContaining({ q: 'exam', type: ['critical'] }),
    })
    vi.useRealTimers()
  })

  it('passes the active filters into the fetch query', async () => {
    hoisted.search = {
      page: 2,
      type: ['critical'],
      category: ['DSA'],
      announcedBy: ['42'],
      startDate: '2026-07-01',
      q: 'x',
    }
    renderPage()
    await waitFor(() =>
      expect(hoisted.fetchAnnouncements).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          q: 'x',
          types: ['critical'],
          categories: ['DSA'],
          announcedBy: ['42'],
          startDate: '2026-07-01',
        }),
      ),
    )
  })
})
