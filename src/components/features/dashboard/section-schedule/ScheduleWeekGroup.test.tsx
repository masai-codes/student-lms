// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ScheduleWeekGroup } from './ScheduleWeekGroup'
import type { ScheduleWeek } from '../shared/types'

afterEach(cleanup)

const week: ScheduleWeek = {
  id: 'w1',
  label: 'JAN 08-15',
  days: [
    {
      id: 'active',
      weekday: 'Wed',
      dayOfMonth: '08',
      isActive: true,
      items: [
        {
          id: 'a',
          type: 'lecture',
          title: 'Active day lecture',
          timeLabel: '10AM',
          courseCode: 'C1',
          category: 'Tutorial',
          module: 'Module 1',
        },
      ],
    },
    {
      id: 'inactive',
      weekday: 'Tue',
      dayOfMonth: '09',
      isActive: false,
      items: [
        {
          id: 'b',
          type: 'notes',
          title: 'Inactive day notes',
          timeLabel: '11AM',
          courseCode: 'C1',
          category: 'Notes',
          module: 'Module 1',
        },
      ],
    },
  ],
}

describe('ScheduleWeekGroup', () => {
  it('renders the week label and both active and inactive day badges', () => {
    render(<ScheduleWeekGroup week={week} />)
    expect(screen.getByText('JAN 08-15')).toBeTruthy()
    // Both weekday labels render regardless of active state
    expect(screen.getByText('Wed')).toBeTruthy()
    expect(screen.getByText('Tue')).toBeTruthy()
    expect(screen.getByText('Active day lecture')).toBeTruthy()
    expect(screen.getByText('Inactive day notes')).toBeTruthy()
  })
})
