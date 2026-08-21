// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import { BookmarksPage } from './BookmarksPage'
import { createEmptyBookmarkFilters } from './bookmarksFilterConfig'

const hoisted = vi.hoisted(() => {
  const search: {
    tab?: string
    page: number
    q?: string
    category?: Array<string>
    status?: Array<string>
    startDate?: string
  } = { page: 1 }
  return { fetchBookmarks: vi.fn(), navigate: vi.fn(), search }
})

vi.mock('@/lib/api/bookmarks/bookmarksApi', () => ({
  fetchBookmarks: hoisted.fetchBookmarks,
}))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    getRouteApi: () => ({ useSearch: () => hoisted.search }),
    useNavigate: () => hoisted.navigate,
    Link: ({ children, to, ...props }: Record<string, unknown>) => (
      <a data-to={String(to)} {...props}>
        {children as React.ReactNode}
      </a>
    ),
  }
})
vi.mock('./BookmarksFilterDrawer', () => ({
  BookmarksFilterDrawer: ({
    onApply,
  }: {
    onApply: (f: ReturnType<typeof createEmptyBookmarkFilters>) => void
  }) => (
    <button
      data-testid="apply-filters"
      onClick={() =>
        onApply({
          ...createEmptyBookmarkFilters(),
          categories: ['DSA'],
          startDate: '2026-07-01',
        })
      }
    />
  ),
}))
vi.mock('./BookmarksAppliedFilters', () => ({
  BookmarksAppliedFilters: ({ onClearAll }: { onClearAll: () => void }) => (
    <button data-testid="chips-clear" onClick={onClearAll} />
  ),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.search = { page: 1 }
  hoisted.fetchBookmarks.mockResolvedValue({
    bookmarks: [
      {
        id: '1',
        ctaUrl: '/lectures/5',
        title: 'Saved Lecture',
        subtitle: '',
        meta: '',
        author: 'Ada',
        savedAt: '2026-07-20T10:00:00.000Z',
        entityType: 'lecture',
        isForYou: false,
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
      <BookmarksPage />
    </QueryClientProvider>,
  )
}

describe('BookmarksPage', () => {
  it('renders bookmarks from the query', async () => {
    renderPage()
    expect(await screen.findByText('Saved Lecture')).toBeTruthy()
  })

  it('shows the empty state when nothing matches', async () => {
    hoisted.fetchBookmarks.mockResolvedValue({ bookmarks: [], total: 0 })
    renderPage()
    expect(await screen.findByTestId('bookmarks-empty')).toBeTruthy()
  })

  it('navigates with applied filters (page reset to 1)', async () => {
    renderPage()
    await screen.findByText('Saved Lecture')
    fireEvent.click(screen.getByTestId('apply-filters'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/bookmarks',
      search: expect.objectContaining({
        tab: 'lectures',
        page: 1,
        category: ['DSA'],
        startDate: '2026-07-01',
      }),
    })
  })

  it('clears every filter from the URL via clear-all', async () => {
    hoisted.search = { page: 1, tab: 'tickets', category: ['Billing'] }
    renderPage()
    await screen.findByText('Saved Lecture')
    fireEvent.click(screen.getByTestId('chips-clear'))
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/bookmarks',
      search: { tab: 'tickets', page: 1, q: undefined },
    })
  })

  it('passes the active filters into the fetch query', async () => {
    hoisted.search = {
      page: 2,
      tab: 'tickets',
      q: 'bug',
      category: ['Billing'],
      status: ['open'],
      startDate: '2026-07-01',
    }
    renderPage()
    await waitFor(() =>
      expect(hoisted.fetchBookmarks).toHaveBeenCalledWith({
        tab: 'tickets',
        page: 2,
        limit: 15,
        q: 'bug',
        filters: expect.objectContaining({
          categories: ['Billing'],
          statuses: ['open'],
          startDate: '2026-07-01',
        }),
      }),
    )
  })
})
