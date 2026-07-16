// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssignmentCompletedBanner } from '../AssignmentCompletedBanner'

describe('AssignmentCompletedBanner', () => {
  it('renders nothing when there are no completed details', () => {
    const { container } = render(
      <AssignmentCompletedBanner completedDetails={null} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders the auto-graded message and variant', () => {
    const { container } = render(
      <AssignmentCompletedBanner
        completedDetails={{
          variant: 'auto-graded',
          completedAtLabel: '20 May, 11:30 AM',
          message: 'This assignment was automatically marked as "Completed".',
        }}
      />,
    )
    const scope = within(container)

    expect(
      scope
        .getByTestId('assignment-completed-banner')
        .getAttribute('data-variant'),
    ).toBe('auto-graded')
    expect(scope.getByText(/automatically marked as "Completed"/)).toBeTruthy()
  })

  it('renders the manual variant message', () => {
    const { container } = render(
      <AssignmentCompletedBanner
        completedDetails={{
          variant: 'manual',
          completedAtLabel: '19 May, 09:00 AM',
          message: 'You have marked this assignment as "Completed".',
        }}
      />,
    )
    const scope = within(container)

    expect(
      scope
        .getByTestId('assignment-completed-banner')
        .getAttribute('data-variant'),
    ).toBe('manual')
    expect(scope.getByText(/You have marked this assignment/)).toBeTruthy()
  })
})
