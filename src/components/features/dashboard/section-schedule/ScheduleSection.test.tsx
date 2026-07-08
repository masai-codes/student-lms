// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScheduleSection } from './ScheduleSection'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
}))

afterEach(cleanup)

const item = (over: Partial<DashboardScheduleItem> = {}): DashboardScheduleItem => ({
  id: 1,
  learningType: 'lecture',
  title: 'Enhanced Interactive Programming Workshop',
  hostName: 'Prof. Anvesh',
  scheduleDate: '2026-07-03 04:30:00',
  concludes: '2026-07-03 05:30:00',
  type: 'live',
  category: 'IIM-M DM',
  isOptional: 'mandatory',
  moduleName: 'Module 1',
  attendance: null,
  assignmentProgressStatus: null,
  resourcePhase: null,
  listingCtas: { joinLive: 'active', joinZoomLink: null, isNewZoomRedirection: false, showAttendance: false, assignmentStatusChip: null, assignmentDeadlineLabel: null },
  courseName: 'Full Stack Section A',
  enableZoomWebView: false,
  ...over,
})

// 06:30 UTC = 12:00 IST on Thu 2026-07-02 → week Jul 02 - 08.
const NOW = new Date('2026-07-02T06:30:00Z')

const props = {
  pendingTasks: [] as Array<DashboardScheduleItem>,
  isLoading: false,
  isError: false,
  now: NOW,
}

describe('ScheduleSection', () => {
  it('renders the 7-day feed with a range header and the reused card on its day', () => {
    // 04:30 UTC = 10:00 IST on Fri Jul 03.
    render(<ScheduleSection {...props} schedule={[item({ scheduleDate: '2026-07-03 04:30:00' })]} />)
    expect(screen.getByTestId('dashboard-schedule-feed')).toBeTruthy()
    expect(screen.getByTestId('dashboard-schedule-range').textContent).toBe('Jul 02 - 08')
    // Every day row is present (7 days), including the item's day.
    expect(screen.getByTestId('dashboard-schedule-day-2026-07-02')).toBeTruthy()
    expect(screen.getByTestId('dashboard-schedule-day-2026-07-08')).toBeTruthy()
    expect(screen.getByText('Enhanced Interactive Programming Workshop')).toBeTruthy()
    expect(screen.getByText('Full Stack Section A')).toBeTruthy()
  })

  it('shows loading and error states from the query', () => {
    const { rerender } = render(<ScheduleSection {...props} schedule={[]} isLoading />)
    expect(screen.getByTestId('dashboard-schedule-loading')).toBeTruthy()

    rerender(<ScheduleSection {...props} schedule={[]} isError />)
    expect(screen.getByTestId('dashboard-schedule-error')).toBeTruthy()
  })

  it('renders every day with a "No sessions" placeholder when nothing is scheduled', () => {
    render(<ScheduleSection {...props} schedule={[]} />)
    expect(screen.getByTestId('dashboard-schedule-feed')).toBeTruthy()
    expect(screen.getAllByText('No sessions scheduled for the day')).toHaveLength(7)
  })

  it('badges the pending count and renders the reused cards on the tasks tab', () => {
    render(
      <ScheduleSection
        {...props}
        schedule={[item()]}
        pendingTasks={[
          item({ id: 10, learningType: 'assignment', title: 'Submit worksheet' }),
          item({ id: 11, learningType: 'lecture', title: 'Catch up lecture' }),
        ]}
      />,
    )
    expect(screen.getByTestId('dashboard-pending-tasks-count').textContent).toBe('2')

    fireEvent.click(screen.getByTestId('dashboard-pending-tasks-tab'))
    expect(screen.getByTestId('dashboard-pending-tasks-feed')).toBeTruthy()
    expect(screen.getByText('Submit worksheet')).toBeTruthy()
    expect(screen.queryByTestId('dashboard-schedule-feed')).toBeNull()
  })

  it('hides the count badge and shows the empty state with no pending tasks', () => {
    render(<ScheduleSection {...props} schedule={[item()]} pendingTasks={[]} />)
    expect(screen.queryByTestId('dashboard-pending-tasks-count')).toBeNull()
    fireEvent.click(screen.getByTestId('dashboard-pending-tasks-tab'))
    expect(screen.getByTestId('dashboard-pending-tasks-empty')).toBeTruthy()
  })
})
