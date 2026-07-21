// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AssignmentLiveAnalytics } from '../AssignmentLiveAnalytics'

const hoisted = vi.hoisted(() => ({ invalidate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))

const analytics = {
  totalQuestions: 10,
  attempted: 8,
  notGraded: 2,
  correct: 5,
  wrong: 1,
}

describe('AssignmentLiveAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('renders nothing when there is no analytics data', () => {
    const { container } = render(
      <AssignmentLiveAnalytics liveAnalytics={null} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders all metric values', () => {
    const { container } = render(
      <AssignmentLiveAnalytics liveAnalytics={analytics} />,
    )
    const scope = within(container)

    expect(
      scope.getByTestId('assignment-live-analytics-totalQuestions').textContent,
    ).toBe('10')
    expect(
      scope.getByTestId('assignment-live-analytics-notGraded').textContent,
    ).toBe('2')
    expect(
      scope.getByTestId('assignment-live-analytics-wrong').textContent,
    ).toBe('1')
  })

  it('renders -- for missing metric values', () => {
    const { container } = render(
      <AssignmentLiveAnalytics
        liveAnalytics={{ ...analytics, totalQuestions: null }}
      />,
    )

    expect(
      within(container).getByTestId('assignment-live-analytics-totalQuestions')
        .textContent,
    ).toBe('--')
  })

  it('invalidates the route when refetch is clicked', () => {
    const { container } = render(
      <AssignmentLiveAnalytics liveAnalytics={analytics} />,
    )

    fireEvent.click(
      within(container).getByTestId('assignment-live-analytics-refetch'),
    )

    expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
  })
})
