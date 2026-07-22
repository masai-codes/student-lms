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
import { AnnouncementFilters } from './AnnouncementFilters'

const hoisted = vi.hoisted(() => ({
  fetchFilterOptions: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  fetchAnnouncementFilterOptions: hoisted.fetchFilterOptions,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

// Deterministic double for the Radix dropdown primitive — its own toggle logic
// is covered by the primitive; here we only verify our change wiring. Clicking
// the trigger appends the first option's value to the current selection.
vi.mock('@/components/ui/masai-dropdown-checkbox-filter', () => ({
  MasaiDropdownCheckboxFilter: ({
    triggerLabel,
    value,
    onValueChange,
    options,
  }: {
    triggerLabel: string
    value: Array<string>
    onValueChange: (next: Array<string>) => void
    options: Array<{ value: string }>
  }) => (
    <button
      data-testid={`mock-filter-${triggerLabel}`}
      onClick={() => onValueChange([...value, options[0].value])}
    >
      {triggerLabel}:{value.join(',')}
    </button>
  ),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hoisted.fetchFilterOptions.mockResolvedValue({
    categories: ['DSA', 'General'],
  })
})

function renderFilters(
  value: { types: Array<string>; categories: Array<string> } = {
    types: [],
    categories: [],
  },
  onChange = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AnnouncementFilters value={value} onChange={onChange} />
    </QueryClientProvider>,
  )
  return { onChange }
}

describe('AnnouncementFilters', () => {
  it('renders the Type filter and shows Category once options load', async () => {
    renderFilters()
    expect(screen.getByTestId('mock-filter-Type')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByTestId('mock-filter-Category')).toBeTruthy(),
    )
    expect(screen.queryByTestId('announcements-filters-clear')).toBeNull()
  })

  it('hides the Category filter when no categories are configured', async () => {
    hoisted.fetchFilterOptions.mockResolvedValue({ categories: [] })
    renderFilters()
    await waitFor(() =>
      expect(hoisted.fetchFilterOptions).toHaveBeenCalled(),
    )
    expect(screen.queryByTestId('mock-filter-Category')).toBeNull()
  })

  it('fires a GTM event and propagates a Type selection', () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByTestId('mock-filter-Type'))
    expect(onChange).toHaveBeenCalledWith({
      types: ['critical'],
      categories: [],
    })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_announcement_filter_type_change',
      { count: 1, values: 'critical' },
    )
  })

  it('fires a GTM event and propagates a Category selection', async () => {
    const { onChange } = renderFilters()
    await waitFor(() =>
      expect(screen.getByTestId('mock-filter-Category')).toBeTruthy(),
    )
    fireEvent.click(screen.getByTestId('mock-filter-Category'))
    expect(onChange).toHaveBeenCalledWith({ types: [], categories: ['DSA'] })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_announcement_filter_category_change',
      { count: 1, values: 'DSA' },
    )
  })

  it('clears all filters when the Clear button is pressed', () => {
    const { onChange } = renderFilters({
      types: ['critical'],
      categories: ['DSA'],
    })
    const clear = screen.getByTestId('announcements-filters-clear')
    fireEvent.click(clear)
    expect(onChange).toHaveBeenCalledWith({ types: [], categories: [] })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_announcement_filter_clear',
      { count: 2 },
    )
  })
})
