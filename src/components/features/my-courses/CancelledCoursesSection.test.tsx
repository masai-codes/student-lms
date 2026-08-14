// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CancelledCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { CancelledCoursesSection } from './CancelledCoursesSection'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function cancelled(
  batchId: number,
  overrides: Partial<CancelledCourseListItem> = {},
): CancelledCourseListItem {
  return {
    batchId,
    courseTitle: `Program ${batchId}`,
    instituteName: 'IIT Patna',
    courseLogo: null,
    cancelledOn: '2026-07-01',
    ...overrides,
  }
}

describe('CancelledCoursesSection', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders nothing when there are no cancelled enrolments', () => {
    const { container } = render(<CancelledCoursesSection courses={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders every card with its formatted cancellation date, uncollapsed, below the threshold', () => {
    render(<CancelledCoursesSection courses={[cancelled(1), cancelled(2)]} />)

    expect(screen.getByTestId('my-courses-cancelled-section')).toBeTruthy()
    expect(screen.getByTestId('my-courses-cancelled-card-1')).toBeTruthy()
    expect(screen.getByTestId('my-courses-cancelled-card-2')).toBeTruthy()
    expect(
      screen.getByTestId('my-courses-cancelled-card-date-1').textContent,
    ).toBe('on 1 Jul 2026')
    expect(screen.queryByTestId('my-courses-cancelled-toggle')).toBeNull()
  })

  it('omits the date line when the cancellation date is missing or unparseable', () => {
    render(
      <CancelledCoursesSection
        courses={[
          cancelled(1, { cancelledOn: null }),
          cancelled(2, { cancelledOn: 'garbage' }),
        ]}
      />,
    )

    expect(screen.queryByTestId('my-courses-cancelled-card-date-1')).toBeNull()
    expect(screen.queryByTestId('my-courses-cancelled-card-date-2')).toBeNull()
    // The pill itself still explains the state.
    expect(screen.getAllByText('Enrolment cancelled')).toHaveLength(2)
  })

  it('collapses the tail at the threshold so active programs stay visible', () => {
    render(
      <CancelledCoursesSection
        courses={[cancelled(1), cancelled(2), cancelled(3), cancelled(4)]}
      />,
    )

    expect(screen.getByTestId('my-courses-cancelled-card-1')).toBeTruthy()
    expect(screen.getByTestId('my-courses-cancelled-card-2')).toBeTruthy()
    expect(screen.queryByTestId('my-courses-cancelled-card-3')).toBeNull()

    const toggle = screen.getByTestId('my-courses-cancelled-toggle')
    expect(toggle.textContent).toContain('Show 2 more')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('expands and collapses again on toggle, tracking each transition', () => {
    render(
      <CancelledCoursesSection
        courses={[cancelled(1), cancelled(2), cancelled(3)]}
      />,
    )

    const toggle = screen.getByTestId('my-courses-cancelled-toggle')
    fireEvent.click(toggle)

    expect(screen.getByTestId('my-courses-cancelled-card-3')).toBeTruthy()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.textContent).toContain('Show less')
    expect(hoisted.pushGtmEvent).toHaveBeenLastCalledWith(
      'l_my_courses_cancelled_section_toggle',
      { source: 'my-courses', expanded: true, cancelledCount: 3 },
    )

    fireEvent.click(toggle)

    expect(screen.queryByTestId('my-courses-cancelled-card-3')).toBeNull()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(hoisted.pushGtmEvent).toHaveBeenLastCalledWith(
      'l_my_courses_cancelled_section_toggle',
      { source: 'my-courses', expanded: false, cancelledCount: 3 },
    )
  })

  it('falls back to the portal wordmark, greyed out, for a cancelled program with no logo', () => {
    render(<CancelledCoursesSection courses={[cancelled(1)]} />)

    const fallback = screen.getByTestId(
      'my-courses-cancelled-card-logo-1-fallback',
    )
    // Muting sits on the wrapper so it applies to whichever theme's artwork shows.
    expect(fallback.className).toContain('grayscale')
    expect(fallback.querySelectorAll('img')).toHaveLength(2)
  })

  it('renders the logo, greyed out, when one is present', () => {
    render(
      <CancelledCoursesSection
        courses={[cancelled(1, { courseLogo: 'https://cdn/x.png' })]}
      />,
    )

    const logo = screen.getByTestId('my-courses-cancelled-card-logo-1')
    expect(logo.getAttribute('src')).toBe('https://cdn/x.png')
    expect(logo.className).toContain('grayscale')
  })
})
