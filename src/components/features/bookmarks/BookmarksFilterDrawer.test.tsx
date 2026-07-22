// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookmarksFilterDrawer } from './BookmarksFilterDrawer'
import { createEmptyBookmarkFilters } from './bookmarksFilterConfig'
import type { BookmarkFilters } from './bookmarksFilterConfig'

const hoisted = vi.hoisted(() => ({
  fetchOptions: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/bookmarks/bookmarksApi', () => ({
  fetchBookmarkFilterOptions: hoisted.fetchOptions,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

// Mock the drawer so we can drive open state + fire the post-close hook.
vi.mock('@/components/ui/masai-drawer', () => ({
  MasaiDrawer: ({
    isOpen,
    onClosed,
    content,
  }: {
    isOpen: boolean
    onClosed?: () => void
    content: React.ReactNode
  }) => (
    <div data-testid="mock-drawer" data-open={String(isOpen)}>
      {isOpen ? content : null}
      <button data-testid="drawer-fire-closed" onClick={() => onClosed?.()} />
    </div>
  ),
}))

vi.mock('./BookmarksFiltersPanel', () => ({
  BookmarksFiltersPanel: ({
    onApply,
  }: {
    onApply: (next: BookmarkFilters) => void
  }) => (
    <button
      data-testid="panel-apply"
      onClick={() =>
        onApply({ ...createEmptyBookmarkFilters(), categories: ['DSA'] })
      }
    />
  ),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.fetchOptions.mockResolvedValue({
    categories: [],
    modules: [],
    statuses: [],
    priorities: [],
  })
})

function renderDrawer(
  filters: BookmarkFilters = createEmptyBookmarkFilters(),
  onApply = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BookmarksFilterDrawer tab="lectures" filters={filters} onApply={onApply} />
    </QueryClientProvider>,
  )
  return { onApply }
}

describe('BookmarksFilterDrawer', () => {
  it('shows no count badge when there are no active filters', () => {
    renderDrawer()
    expect(screen.queryByTestId('bookmarks-filter-count')).toBeNull()
  })

  it('shows the active filter count on the trigger', () => {
    renderDrawer({ ...createEmptyBookmarkFilters(), categories: ['a', 'b'] })
    expect(screen.getByTestId('bookmarks-filter-count').textContent).toBe('2')
  })

  it('opens the drawer from the trigger', () => {
    renderDrawer()
    expect(screen.getByTestId('mock-drawer').dataset.open).toBe('false')
    fireEvent.click(screen.getByTestId('bookmarks-filter-trigger'))
    expect(screen.getByTestId('mock-drawer').dataset.open).toBe('true')
  })

  it('defers the commit until the drawer close animation finishes', () => {
    const { onApply } = renderDrawer()
    fireEvent.click(screen.getByTestId('bookmarks-filter-trigger'))
    fireEvent.click(screen.getByTestId('panel-apply'))

    // Apply fires GTM + closes the drawer, but does NOT commit yet.
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_bookmarks_filter_apply',
      { tab: 'lectures', count: 1 },
    )
    expect(onApply).not.toHaveBeenCalled()

    // Commit happens once the drawer reports it has closed.
    fireEvent.click(screen.getByTestId('drawer-fire-closed'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['DSA'] }),
    )
  })
})
