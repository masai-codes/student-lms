// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ReadOnlyCalendar from './ReadOnlyCalendar'
import { MONTH_NAMES, toDateKey } from './calendarUtils'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ReadOnlyCalendar', () => {
  it('renders the current month and a clickable day per date', () => {
    render(<ReadOnlyCalendar eventDateKeys={new Set()} />)
    const now = new Date()
    expect(
      screen.getByText(`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`),
    ).toBeTruthy()
    // Day 1 is rendered as a button.
    expect(screen.getByRole('button', { name: '1' })).toBeTruthy()
  })

  it('marks event days in the accessible label', () => {
    const today = new Date()
    const firstKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), 1))
    render(<ReadOnlyCalendar eventDateKeys={new Set([firstKey])} />)
    expect(screen.getByRole('button', { name: '1, has events' })).toBeTruthy()
  })

  it('calls onSelectDate with the clicked day key', () => {
    const today = new Date()
    const onSelectDate = vi.fn()
    render(
      <ReadOnlyCalendar eventDateKeys={new Set()} onSelectDate={onSelectDate} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onSelectDate).toHaveBeenCalledWith(
      toDateKey(new Date(today.getFullYear(), today.getMonth(), 5)),
    )
  })

  it('marks the selected day as pressed', () => {
    const today = new Date()
    const selectedKey = toDateKey(
      new Date(today.getFullYear(), today.getMonth(), 7),
    )
    render(
      <ReadOnlyCalendar
        eventDateKeys={new Set()}
        selectedDateKey={selectedKey}
      />,
    )
    expect(
      screen.getByRole('button', { name: '7' }).getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('browses to the previous and next month', () => {
    // Pin "today" to mid-June 2026 so navigation is deterministic.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    render(<ReadOnlyCalendar eventDateKeys={new Set()} />)

    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getByText('May 2026')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Next month'))
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText('July 2026')).toBeTruthy()
  })
})
