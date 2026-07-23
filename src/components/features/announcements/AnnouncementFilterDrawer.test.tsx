// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementFilterDrawer } from './AnnouncementFilterDrawer'
import { createEmptyAnnouncementFilters } from './announcementFilterConfig'
import type { AnnouncementFilters } from './announcementFilterConfig'

const hoisted = vi.hoisted(() => ({
  fetchOptions: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  fetchAnnouncementFilterOptions: hoisted.fetchOptions,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
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
vi.mock('./AnnouncementFiltersPanel', () => ({
  AnnouncementFiltersPanel: ({
    onApply,
  }: {
    onApply: (next: AnnouncementFilters) => void
  }) => (
    <button
      data-testid="panel-apply"
      onClick={() =>
        onApply({ ...createEmptyAnnouncementFilters(), types: ['critical'] })
      }
    />
  ),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.fetchOptions.mockResolvedValue({ categories: [], announcers: [] })
})

function renderDrawer(
  filters: AnnouncementFilters = createEmptyAnnouncementFilters(),
  onApply = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AnnouncementFilterDrawer filters={filters} onApply={onApply} />
    </QueryClientProvider>,
  )
  return { onApply }
}

describe('AnnouncementFilterDrawer', () => {
  it('hides the count badge with no active filters', () => {
    renderDrawer()
    expect(screen.queryByTestId('announcements-filter-count')).toBeNull()
  })

  it('shows the active filter count', () => {
    renderDrawer({
      ...createEmptyAnnouncementFilters(),
      types: ['critical'],
      categories: ['DSA'],
    })
    expect(screen.getByTestId('announcements-filter-count').textContent).toBe(
      '2',
    )
  })

  it('opens the drawer from the trigger', () => {
    renderDrawer()
    expect(screen.getByTestId('mock-drawer').dataset.open).toBe('false')
    fireEvent.click(screen.getByTestId('announcements-filter-trigger'))
    expect(screen.getByTestId('mock-drawer').dataset.open).toBe('true')
  })

  it('defers the commit to the drawer close animation and fires GTM', () => {
    const { onApply } = renderDrawer()
    fireEvent.click(screen.getByTestId('announcements-filter-trigger'))
    fireEvent.click(screen.getByTestId('panel-apply'))

    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_announcement_filter_apply',
      { count: 1 },
    )
    expect(onApply).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('drawer-fire-closed'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ types: ['critical'] }),
    )
  })

  it('commits via the fallback timer when the close animation never reports', () => {
    const { onApply } = renderDrawer()
    fireEvent.click(screen.getByTestId('announcements-filter-trigger'))
    vi.useFakeTimers()
    fireEvent.click(screen.getByTestId('panel-apply'))
    expect(onApply).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ types: ['critical'] }),
    )
    vi.useRealTimers()
  })
})
