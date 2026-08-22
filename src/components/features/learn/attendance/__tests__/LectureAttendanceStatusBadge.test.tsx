// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LectureAttendanceStatusBadge } from '../LectureAttendanceStatusBadge'

describe('LectureAttendanceStatusBadge — default (attendance mandatory)', () => {
  afterEach(() => cleanup())

  it.each([
    ['present', 'Present'],
    ['absent', 'Absent'],
    ['continue_watching', 'Continue Watching'],
    ['att_window_over', 'Absent and Att. Window Over'],
  ] as const)('renders the "%s" label text (not icon-only)', (state, label) => {
    render(<LectureAttendanceStatusBadge state={state} />)
    expect(screen.getByText(label)).toBeTruthy()
  })
})

describe('LectureAttendanceStatusBadge — iconOnly (attendance not mandatory)', () => {
  afterEach(() => cleanup())

  it.each([
    ['present', 'Present'],
    ['absent', 'Absent'],
    ['att_window_over', 'Absent and Att. Window Over'],
  ] as const)(
    'renders the "%s" state as a bare icon, keeping "%s" for screen readers',
    (state, label) => {
      render(<LectureAttendanceStatusBadge state={state} iconOnly />)
      expect(screen.queryByText(label)).toBeNull()
      expect(screen.getByLabelText(label)).toBeTruthy()
      expect(screen.getByTestId('lecture-attendance-icon-badge')).toBeTruthy()
    },
  )

  it('keeps the Continue Watching wording even when iconOnly', () => {
    render(<LectureAttendanceStatusBadge state="continue_watching" iconOnly />)
    expect(screen.getByText('Continue Watching')).toBeTruthy()
    expect(screen.queryByTestId('lecture-attendance-icon-badge')).toBeNull()
  })
})
