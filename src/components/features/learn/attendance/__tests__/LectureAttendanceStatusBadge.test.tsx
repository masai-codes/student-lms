// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LectureAttendanceStatusBadge } from '../LectureAttendanceStatusBadge'

describe('LectureAttendanceStatusBadge — always shows label text', () => {
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
