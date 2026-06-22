// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssignmentProblemList } from '../AssignmentProblemList'

describe('AssignmentProblemList', () => {
  it('renders nothing when there are no problems', () => {
    const { container } = render(<AssignmentProblemList problems={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders a card per problem with its status chip', () => {
    const { container } = render(
      <AssignmentProblemList
        problems={[
          {
            elementId: 1,
            problemId: 11,
            title: 'Two Sum',
            statusChip: { tone: 'completed', label: 'Completed' },
          },
          {
            elementId: 2,
            problemId: 12,
            title: 'Reverse List',
            statusChip: null,
          },
        ]}
      />,
    )
    const scope = within(container)

    expect(scope.getByText('Two Sum')).toBeTruthy()
    expect(scope.getByTestId('assignment-problem-1-status').textContent).toContain(
      'Completed',
    )
    expect(scope.getByText('Reverse List')).toBeTruthy()
    // No status chip rendered for the problem without a status.
    expect(scope.queryByTestId('assignment-problem-2-status')).toBeNull()
  })
})
