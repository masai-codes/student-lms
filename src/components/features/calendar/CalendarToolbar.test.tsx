// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { CalendarToolbar } from './CalendarToolbar'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

const BATCHES = [
  { id: 1, name: 'FS Batch' },
  { id: 2, name: 'DA Batch' },
]

function renderToolbar(
  over: Partial<Parameters<typeof CalendarToolbar>[0]> = {},
) {
  const props = {
    title: 'August 2026',
    view: 'week' as const,
    availableViews: ['month', 'week', 'day'] as Array<'month' | 'week' | 'day'>,
    onViewChange: vi.fn(),
    onNavigate: vi.fn(),
    batches: BATCHES,
    batchId: undefined,
    onBatchChange: vi.fn(),
    ...over,
  }
  render(<CalendarToolbar {...props} />)
  return props
}

describe('CalendarToolbar', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the title, legend, and all views', () => {
    renderToolbar()
    expect(screen.getByTestId('my-calendar-title').textContent).toBe(
      'August 2026',
    )
    expect(screen.getByTestId('my-calendar-legend')).toBeTruthy()
    expect(screen.getByTestId('my-calendar-view-month')).toBeTruthy()
    expect(
      screen.getByTestId('my-calendar-view-week').getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('fires navigation callbacks and GTM events', () => {
    const onNavigate = vi.fn()
    renderToolbar({ onNavigate })
    fireEvent.click(screen.getByTestId('my-calendar-today'))
    fireEvent.click(screen.getByTestId('my-calendar-prev'))
    fireEvent.click(screen.getByTestId('my-calendar-next'))
    expect(onNavigate.mock.calls.map((call) => call[0])).toEqual([
      'today',
      'prev',
      'next',
    ])
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_navigate_today',
      { view: 'week' },
    )
  })

  it('switches views with tracking', () => {
    const props = renderToolbar()
    fireEvent.click(screen.getByTestId('my-calendar-view-day'))
    expect(props.onViewChange).toHaveBeenCalledWith('day')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith('l_calendar_view_day', {})
  })

  it('hides the batch filter for single-batch students', () => {
    renderToolbar({ batches: [BATCHES[0]] })
    expect(screen.queryByTestId('my-calendar-batch-filter')).toBeNull()
  })

  it('offers All + each batch and reports the change', () => {
    const props = renderToolbar()
    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Filter by batch' }),
      { pointerId: 1 },
    )
    fireEvent.click(screen.getByText('DA Batch'))
    expect(props.onBatchChange).toHaveBeenCalledWith(2)
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_batch_filter',
      { batch_id: 2 },
    )
  })

  it('maps the All option back to undefined', () => {
    const props = renderToolbar({ batchId: 2 })
    fireEvent.pointerDown(
      screen.getByRole('button', { name: 'Filter by batch' }),
      { pointerId: 1 },
    )
    fireEvent.click(screen.getByText('All batches'))
    expect(props.onBatchChange).toHaveBeenCalledWith(undefined)
  })
})
