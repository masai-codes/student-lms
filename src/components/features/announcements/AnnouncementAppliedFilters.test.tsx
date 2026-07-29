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
import { AnnouncementAppliedFilters } from './AnnouncementAppliedFilters'
import { createEmptyAnnouncementFilters } from './announcementFilterConfig'

const hoisted = vi.hoisted(() => ({ fetchOptions: vi.fn() }))

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  fetchAnnouncementFilterOptions: hoisted.fetchOptions,
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.fetchOptions.mockResolvedValue({
    categories: ['DSA'],
    announcers: [{ id: '42', name: 'Ada' }],
  })
})

function renderApplied(
  filters = createEmptyAnnouncementFilters(),
  onChange = vi.fn(),
  onClearAll = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AnnouncementAppliedFilters
        filters={filters}
        onChange={onChange}
        onClearAll={onClearAll}
      />
    </QueryClientProvider>,
  )
  return { onChange, onClearAll }
}

describe('AnnouncementAppliedFilters', () => {
  it('renders nothing when there are no active filters', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <AnnouncementAppliedFilters
          filters={createEmptyAnnouncementFilters()}
          onChange={vi.fn()}
          onClearAll={vi.fn()}
        />
      </QueryClientProvider>,
    )
    expect(container.querySelector('[data-testid="announcements-applied-filters"]')).toBeNull()
  })

  it('resolves the announcer name from the cached options and removes a chip', async () => {
    const { onChange } = renderApplied({
      ...createEmptyAnnouncementFilters(),
      announcedBy: ['42'],
    })
    // Name resolves once the options query settles.
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy())
    fireEvent.click(screen.getByTestId('announcements-chip-announcedBy:42'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ announcedBy: [] }),
    )
  })

  it('fires onClearAll', () => {
    const { onClearAll } = renderApplied({
      ...createEmptyAnnouncementFilters(),
      types: ['critical'],
    })
    fireEvent.click(screen.getByTestId('announcements-clear-all'))
    expect(onClearAll).toHaveBeenCalledOnce()
  })
})
