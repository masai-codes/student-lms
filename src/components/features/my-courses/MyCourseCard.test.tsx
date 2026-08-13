// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import type { MyCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { MyCourseCard } from './MyCourseCard'

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

function course(overrides: Partial<MyCourseListItem> = {}): MyCourseListItem {
  return {
    batchId: 10,
    courseTitle: 'AI & Machine Learning',
    instituteName: 'IIT Patna',
    courseLogo: 'https://cdn/aiml.png',
    courseProgress: 42,
    showBatchDetails: true,
    ...overrides,
  }
}

describe('MyCourseCard', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the title, institute and logo', () => {
    render(<MyCourseCard course={course()} />)

    expect(screen.getByTestId('my-courses-card-title-10').textContent).toBe(
      'AI & Machine Learning',
    )
    expect(screen.getByText('IIT Patna')).toBeTruthy()
    expect(screen.getByTestId('my-courses-card-logo-10').getAttribute('src')).toBe(
      'https://cdn/aiml.png',
    )
  })

  it('links the whole card to the program detail page', () => {
    render(<MyCourseCard course={course()} />)

    const card = screen.getByTestId('my-courses-card-10')
    expect(card.getAttribute('data-to')).toBe('/course/$batchId')
    expect(card.getAttribute('data-batch-id')).toBe('10')
    expect(screen.getByTestId('my-courses-card-details-cta-10')).toBeTruthy()
  })

  it('exposes progress as an accessible progressbar', () => {
    render(<MyCourseCard course={course()} />)

    const bar = screen.getByTestId('my-courses-card-progress-10')
    expect(bar.getAttribute('role')).toBe('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('42')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.getByText('42%')).toBeTruthy()
  })

  it('fires a batch-scoped GTM event on click', () => {
    render(<MyCourseCard course={course()} />)
    fireEvent.click(screen.getByTestId('my-courses-card-10'))

    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_my_courses_card_click_id_10',
      expect.objectContaining({
        source: 'my-courses',
        batchId: 10,
        courseTitle: 'AI & Machine Learning',
        instituteName: 'IIT Patna',
        courseProgress: 42,
      }),
    )
  })

  it('renders an inert card with no progress or CTA when showBatchDetails is false', () => {
    render(<MyCourseCard course={course({ showBatchDetails: false })} />)

    const card = screen.getByTestId('my-courses-card-10')
    expect(card.tagName).toBe('DIV')
    expect(card.getAttribute('data-to')).toBeNull()
    expect(screen.queryByTestId('my-courses-card-progress-10')).toBeNull()
    expect(screen.queryByTestId('my-courses-card-details-cta-10')).toBeNull()
    // Still identifies the program.
    expect(screen.getByTestId('my-courses-card-title-10')).toBeTruthy()
  })

  it('does not track a click on an inert card', () => {
    render(<MyCourseCard course={course({ showBatchDetails: false })} />)
    fireEvent.click(screen.getByTestId('my-courses-card-10'))

    expect(hoisted.pushGtmEvent).not.toHaveBeenCalled()
  })

  it('falls back to an icon tile when there is no logo', () => {
    render(<MyCourseCard course={course({ courseLogo: null })} />)

    expect(screen.getByTestId('my-courses-card-logo-10-fallback')).toBeTruthy()
    expect(screen.queryByTestId('my-courses-card-logo-10')).toBeNull()
  })

  it('falls back to an icon tile when the logo url fails to load', () => {
    render(<MyCourseCard course={course()} />)

    fireEvent.error(screen.getByTestId('my-courses-card-logo-10'))

    expect(screen.getByTestId('my-courses-card-logo-10-fallback')).toBeTruthy()
    expect(screen.queryByTestId('my-courses-card-logo-10')).toBeNull()
  })

  it('renders a 0% bar without collapsing the track', () => {
    render(<MyCourseCard course={course({ courseProgress: 0 })} />)

    const bar = screen.getByTestId('my-courses-card-progress-10')
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('0%')
    expect(screen.getByText('0%')).toBeTruthy()
  })
})
