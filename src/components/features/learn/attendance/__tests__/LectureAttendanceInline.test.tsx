// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LectureAttendanceInline } from '../LectureAttendanceInline'

import type { LectureAttendanceSummary } from '@/server/attendance/types'

const attendanceRender = {
  uiState: 'absent' as const,
  daysRemaining: 4,
  showBadge: true,
  iconOnly: false,
}

const attendanceSummary: LectureAttendanceSummary = {
  overallStatus: 0,
  notApplicable: false,
  hasStudentAttendanceEntry: true,
  isCatchupWindowOver: false,
  videoPercentage: 0,
  watchPercentage: 0,
  daysRemaining: 4,
  lateByMinutes: null,
  liveAttendanceStatus: 0,
  videoAttendanceStatus: 0,
  includeVideoAttendance: true,
  videoCountsForAttendance: true,
  markAbsentIfLate: false,
  isAttendanceMandatory: true,
}

describe('LectureAttendanceInline', () => {
  afterEach(() => cleanup())

  it('stacks the days label and badge by default (mobile column)', () => {
    const { container } = render(
      <LectureAttendanceInline {...attendanceRender} />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('flex-col')
    expect(wrapper.className).not.toContain('flex-row items-center')
  })

  it('keeps them on one row when forceRow is set', () => {
    const { container } = render(
      <LectureAttendanceInline {...attendanceRender} forceRow />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('flex-row')
    expect(wrapper.className).not.toContain('flex-col')
  })

  it('renders no hover trigger when attendance is not provided', () => {
    const { container } = render(
      <LectureAttendanceInline {...attendanceRender} />,
    )
    expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeNull()
  })

  it('wraps the badge in a hover trigger when attendance is provided', () => {
    const { container } = render(
      <LectureAttendanceInline
        {...attendanceRender}
        attendance={attendanceSummary}
        isLiveLecture
      />,
    )
    const trigger = container.querySelector('[data-slot="tooltip-trigger"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.textContent).toContain('Absent')
  })

  it('moves the hover onto the countdown when only days are visible', () => {
    const { container } = render(
      <LectureAttendanceInline
        {...attendanceRender}
        showBadge={false}
        attendance={attendanceSummary}
        isLiveLecture
      />,
    )
    const trigger = container.querySelector('[data-slot="tooltip-trigger"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.textContent).toContain('4 days remaining')
  })
})
