// @vitest-environment jsdom
import { act, fireEvent, render, within } from '@testing-library/react'
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

  // `act` is required, not cosmetic: the click handler is async — it sets
  // `refreshing`, awaits router.invalidate(), then clears the flag in a
  // `finally`. A bare fireEvent.click leaves that trailing setState pending, so
  // React flushes the re-render after the test (and the jsdom environment) has
  // been torn down, crashing the whole vitest run with "window is not defined".
  // Awaiting act() drains the update inside the test, where the DOM still exists.
  it('invalidates the route when refetch is clicked', async () => {
    const { container } = render(
      <AssignmentLiveAnalytics liveAnalytics={analytics} />,
    )

    await act(async () => {
      fireEvent.click(
        within(container).getByTestId('assignment-live-analytics-refetch'),
      )
    })

    expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
  })
})
