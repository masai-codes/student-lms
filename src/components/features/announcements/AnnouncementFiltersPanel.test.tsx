// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementFiltersPanel } from './AnnouncementFiltersPanel'
import { createEmptyAnnouncementFilters } from './announcementFilterConfig'

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

afterEach(cleanup)

function renderPanel(onApply = vi.fn()) {
  render(
    <AnnouncementFiltersPanel
      filtersOpen
      categoryOptions={[{ value: 'DSA', label: 'DSA' }]}
      announcerOptions={[{ value: '42', label: 'Ada' }]}
      selectedFilters={createEmptyAnnouncementFilters()}
      onApply={onApply}
    />,
  )
  return { onApply }
}

describe('AnnouncementFiltersPanel', () => {
  it('renders all four sections with Type active by default', () => {
    renderPanel()
    expect(screen.getByTestId('announcements-filter-nav-type')).toBeTruthy()
    expect(screen.getByTestId('announcements-filter-nav-category')).toBeTruthy()
    expect(
      screen.getByTestId('announcements-filter-nav-announcedBy'),
    ).toBeTruthy()
    expect(screen.getByTestId('announcements-filter-nav-date')).toBeTruthy()
    expect(screen.getByText('Critical')).toBeTruthy()
  })

  it('applies a type selection', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByText('Critical'))
    fireEvent.click(screen.getByTestId('announcements-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ types: ['critical'] }),
    )
  })

  it('applies an announced-by selection (author id)', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByTestId('announcements-filter-nav-announcedBy'))
    fireEvent.click(screen.getByText('Ada'))
    fireEvent.click(screen.getByTestId('announcements-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ announcedBy: ['42'] }),
    )
  })

  it('applies an announced-date range', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByTestId('announcements-filter-nav-date'))
    fireEvent.click(screen.getByTestId('mock-date-range'))
    fireEvent.click(screen.getByTestId('announcements-filter-apply'))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
    )
  })

  it('clears all filters', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByText('Critical'))
    fireEvent.click(screen.getByTestId('announcements-filter-clear'))
    expect(onApply).toHaveBeenCalledWith(createEmptyAnnouncementFilters())
  })
})
