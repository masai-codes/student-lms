// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AssignmentProblemList } from '../AssignmentProblemList'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    ...props
  }: {
    children: React.ReactNode
    params?: { assignmentId: string; problemId: string }
    [key: string]: unknown
  }) => (
    <a
      href={`/assignments/${params?.assignmentId}/problems/${params?.problemId}`}
      {...props}
    >
      {children}
    </a>
  ),
}))

describe('AssignmentProblemList', () => {
  it('renders nothing when there are no problems', () => {
    const { container } = render(
      <AssignmentProblemList assignmentId={99} problems={[]} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders a linked card per problem with its status chip', () => {
    const { container } = render(
      <AssignmentProblemList
        assignmentId={99}
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

    const firstCard = scope.getByTestId('assignment-problem-1')
    expect(firstCard.getAttribute('href')).toBe('/assignments/99/problems/11')
    expect(within(firstCard).getByText('Two Sum')).toBeTruthy()
    expect(scope.getByTestId('assignment-problem-1-status').textContent).toContain(
      'Completed',
    )
    expect(scope.queryByTestId('assignment-problem-2-status')).toBeNull()
  })
})
