// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ScheduleSection } from './ScheduleSection'
import type { ScheduleWeek } from '../shared/types'

afterEach(cleanup)

const weeks: Array<ScheduleWeek> = [
  {
    id: 'w1',
    label: 'JAN 08-15',
    days: [
      {
        id: 'd1',
        weekday: 'Wed',
        dayOfMonth: '08',
        isActive: true,
        items: [
          {
            id: 'i1',
            type: 'lecture',
            title: 'Workshop',
            timeLabel: '10AM',
            courseCode: 'C1',
            category: 'Tutorial',
            module: 'Module 1',
          },
        ],
      },
    ],
  },
]

describe('ScheduleSection', () => {
  it('shows the schedule feed by default with the pending task count', () => {
    render(<ScheduleSection weeks={weeks} pendingTaskCount={3} />)
    expect(screen.getByText('JAN 08-15')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('switches to the pending tasks empty state when its tab is clicked', () => {
    render(<ScheduleSection weeks={weeks} pendingTaskCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /Pending Tasks/ }))
    expect(screen.getByText(/all caught up on tasks/i)).toBeTruthy()
    expect(screen.queryByText('JAN 08-15')).toBeNull()
  })

  it('renders the empty schedule message when there are no weeks', () => {
    render(<ScheduleSection weeks={[]} pendingTaskCount={0} />)
    expect(screen.getByText(/nothing scheduled/i)).toBeTruthy()
  })
})
