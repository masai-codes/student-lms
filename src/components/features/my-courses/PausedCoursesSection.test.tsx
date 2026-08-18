// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import type { PausedCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { PausedCoursesSection } from './PausedCoursesSection'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    Link: ({
      children,
      to,
      params,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <a
        data-to={String(to)}
        data-batch-id={(params as { batchId?: string } | undefined)?.batchId}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

function paused(
  batchId: number,
  overrides: Partial<PausedCourseListItem> = {},
): PausedCourseListItem {
  return {
    batchId,
    courseTitle: `Program ${batchId}`,
    instituteName: 'IIT Patna',
    courseLogo: null,
    pausedOn: '2026-07-02',
    showBatchDetails: true,
    ...overrides,
  }
}

describe('PausedCoursesSection', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders nothing when no program is paused', () => {
    const { container } = render(<PausedCoursesSection courses={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders every paused program with a Paused badge and its formatted pause date', () => {
    render(<PausedCoursesSection courses={[paused(1), paused(2)]} />)

    expect(screen.getByTestId('my-courses-paused-section')).toBeTruthy()
    expect(screen.getByTestId('my-courses-paused-card-1')).toBeTruthy()
    expect(screen.getByTestId('my-courses-paused-card-2')).toBeTruthy()
    expect(
      screen.getByTestId('my-courses-paused-card-badge-1').textContent,
    ).toContain('Paused')
    expect(screen.getByTestId('my-courses-paused-card-date-1').textContent).toBe(
      'since 2 Jul 2026',
    )
  })

  it('omits the date line when the pause date is missing or unparseable', () => {
    render(
      <PausedCoursesSection
        courses={[paused(1, { pausedOn: null }), paused(2, { pausedOn: 'garbage' })]}
      />,
    )

    expect(screen.queryByTestId('my-courses-paused-card-date-1')).toBeNull()
    expect(screen.queryByTestId('my-courses-paused-card-date-2')).toBeNull()
    // The badge itself still explains the state.
    expect(screen.getAllByText('Paused')).toHaveLength(2)
  })

  it('still links to the program — a pause leaves pre-pause content available', () => {
    render(<PausedCoursesSection courses={[paused(1)]} />)

    const card = screen.getByTestId('my-courses-paused-card-1')
    expect(card.getAttribute('data-to')).toBe('/course/$batchId')
    expect(card.getAttribute('data-batch-id')).toBe('1')
    expect(screen.getByTestId('my-courses-paused-card-details-cta-1')).toBeTruthy()
  })

  it('leaves a details-disabled paused program inert, with no CTA', () => {
    render(<PausedCoursesSection courses={[paused(1, { showBatchDetails: false })]} />)

    expect(screen.getByTestId('my-courses-paused-card-1').tagName).toBe('DIV')
    expect(screen.queryByTestId('my-courses-paused-card-details-cta-1')).toBeNull()
  })

  it('tracks a click on a paused program card', () => {
    render(<PausedCoursesSection courses={[paused(7)]} />)

    fireEvent.click(screen.getByTestId('my-courses-paused-card-7'))

    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_my_courses_paused_card_click_id_7',
      {
        source: 'my-courses',
        batchId: 7,
        courseTitle: 'Program 7',
        instituteName: 'IIT Patna',
        pausedOn: '2026-07-02',
      },
    )
  })

  it('never renders a progress bar — calendar progress is misleading while paused', () => {
    render(<PausedCoursesSection courses={[paused(1)]} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
