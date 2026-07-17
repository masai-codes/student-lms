// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LECTURE_ATTENDANCE_BANNERS } from '@/lib/lecture-attendance/resolveLectureAttendanceBanner'
import { LectureAttendanceBanner } from '../LectureAttendanceBanner'

describe('LectureAttendanceBanner', () => {
  afterEach(() => cleanup())

  it('renders the video-counts copy and testid', () => {
    const banner = LECTURE_ATTENDANCE_BANNERS['video-counts']
    render(<LectureAttendanceBanner banner={banner} />)

    expect(screen.getByTestId(banner.testId)).toBeTruthy()
    expect(screen.getByText(banner.text)).toBeTruthy()
  })

  it('renders the live-only copy and testid', () => {
    const banner = LECTURE_ATTENDANCE_BANNERS['live-only']
    render(<LectureAttendanceBanner banner={banner} />)

    expect(screen.getByTestId(banner.testId)).toBeTruthy()
    expect(screen.getByText(banner.text)).toBeTruthy()
  })
})
