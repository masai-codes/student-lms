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

const hoisted = vi.hoisted(() => {
  const search: {
    page: number
    q?: string
    message?: boolean
    type?: Array<string>
    category?: Array<string>
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
vi.mock('./AnnouncementFilters', () => ({
  AnnouncementFilters: ({
    onChange,
  }: {
    onChange: (v: { types: Array<string>; categories: Array<string> }) => void
  }) => (
    <>
      <button
        data-testid="mock-apply-filters"
        onClick={() => onChange({ types: ['critical'], categories: ['DSA'] })}
      />
      <button
        data-testid="mock-clear-filters"
        onClick={() => onChange({ types: [], categories: [] })}
      />
    </>
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
  it('renders announcements returned by the query', async () => {
    renderPage()
    expect(await screen.findByText('Welcome')).toBeTruthy()
  })

  it('renders the empty state when no announcements match', async () => {
    hoisted.fetchAnnouncements.mockResolvedValue({ announcements: [], total: 0 })
    renderPage()
    expect(await screen.findByTestId('announcements-empty')).toBeTruthy()
  })

  it('navigates with the selected type/category filters (resetting page)', async () => {
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('mock-apply-filters'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: {
        q: undefined,
        page: 1,
        message: undefined,
        type: ['critical'],
        category: ['DSA'],
      },
    })
  })

  it('drops the filter params from the URL when cleared', async () => {
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('mock-clear-filters'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: {
        q: undefined,
        page: 1,
        message: undefined,
        type: undefined,
        category: undefined,
      },
    })
  })

  it('preserves active filters when toggling "Important for you"', async () => {
    hoisted.search = { page: 1, type: ['critical'], category: ['DSA'] }
    renderPage()
    await screen.findByText('Welcome')
    fireEvent.click(screen.getByTestId('announcements-important-toggle'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: {
        q: undefined,
        page: 1,
        message: true,
        type: ['critical'],
        category: ['DSA'],
      },
    })
  })

  it('debounces the search box and preserves filters', async () => {
    vi.useFakeTimers()
    hoisted.search = { page: 1, type: ['critical'] }
    renderPage()
    const input = screen.getByPlaceholderText('Search Announcements')
    fireEvent.change(input, { target: { value: 'exam' } })
    await act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/announcements',
      search: { q: 'exam', page: 1, message: undefined, type: ['critical'], category: undefined },
    })
    vi.useRealTimers()
  })

  it('passes the current filters to the fetch query', async () => {
    hoisted.search = { page: 2, type: ['critical'], category: ['DSA'], q: 'x' }
    renderPage()
    await waitFor(() =>
      expect(hoisted.fetchAnnouncements).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        q: 'x',
        message: false,
        types: ['critical'],
        categories: ['DSA'],
      }),
    )
  })
})
