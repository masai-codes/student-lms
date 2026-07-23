// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookmarksFiltersPanel } from './BookmarksFiltersPanel'
import { createEmptyBookmarkFilters } from './bookmarksFilterConfig'

vi.mock('@/components/ui/masai-date-range-picker', () => ({
  MasaiDateRangePicker: ({
    onChange,
  }: {
    onChange: (r: { start: string | null; end: string | null }) => void
  }) => (
    <button
      data-testid="mock-date-range"
      onClick={() => onChange({ start: '2026-07-01', end: '2026-07-31' })}
    >
      date
    </button>
  ),
}))

const OPTIONS = {
  categories: ['DSA', 'Coding'],
  modules: ['Module 1'],
  statuses: [],
  priorities: [],
}

afterEach(cleanup)

function renderPanel(onApply = vi.fn()) {
  render(
    <BookmarksFiltersPanel
      tab="lectures"
      filtersOpen
      options={OPTIONS}
      selectedFilters={createEmptyBookmarkFilters()}
      onApply={onApply}
    />,
  )
  return { onApply }
}

describe('BookmarksFiltersPanel', () => {
  it('renders the nav sections for the tab and category options by default', () => {
    renderPanel()
    expect(screen.getByTestId('bookmarks-filter-nav-category')).toBeTruthy()
    expect(screen.getByTestId('bookmarks-filter-nav-module')).toBeTruthy()
    expect(screen.getByTestId('bookmarks-filter-nav-type')).toBeTruthy()
    expect(screen.getByTestId('bookmarks-filter-nav-date')).toBeTruthy()
    expect(screen.getByText('DSA')).toBeTruthy()
  })

  it('applies a toggled category selection', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByText('DSA'))
    fireEvent.click(screen.getByTestId('bookmarks-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['DSA'] }),
    )
  })

  it('switches to the Type section and applies a fixed type option', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByTestId('bookmarks-filter-nav-type'))
    fireEvent.click(screen.getByText('Resource'))
    fireEvent.click(screen.getByTestId('bookmarks-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ types: ['resource'] }),
    )
  })

  it('applies a saved-date range from the date section', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByTestId('bookmarks-filter-nav-date'))
    fireEvent.click(screen.getByTestId('mock-date-range'))
    fireEvent.click(screen.getByTestId('bookmarks-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
    )
  })

  it('clears all filters immediately', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByText('DSA'))
    fireEvent.click(screen.getByTestId('bookmarks-filter-clear'))
    expect(onApply).toHaveBeenCalledWith(createEmptyBookmarkFilters())
  })
})
