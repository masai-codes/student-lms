// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LectureAttendanceInline } from '../LectureAttendanceInline'

const attendanceRender = {
  uiState: 'absent' as const,
  daysRemaining: 4,
  showBadge: true,
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
})
