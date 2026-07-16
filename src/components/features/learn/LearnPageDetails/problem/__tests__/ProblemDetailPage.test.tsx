// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProblemDetailPage } from '../ProblemDetailPage'
import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}))
vi.mock('@/components/shared/markdown-content', () => ({
  MarkdownContent: ({ value }: { value: string }) => <div>{value}</div>,
}))

function detail(
  overrides: Partial<ProblemDetailPayload> = {},
): ProblemDetailPayload {
  return {
    assignmentId: 99,
    problemId: 11,
    elementId: 1,
    assignmentTitle: 'Week 1 Assignment',
    problemTitle: 'Two Sum',
    statement: 'Solve the problem',
    type: 'LINK',
    acceptsSubmission: true,
    allowMultipleSubmissions: false,
    canSubmit: true,
    solution: { id: 7, submissionLink: null, submittedAtLabel: null },
    ...overrides,
  }
}

describe('ProblemDetailPage', () => {
  it('renders the header, statement and the submission form when submittable', () => {
    const { container } = render(<ProblemDetailPage detail={detail()} />)
    const scope = within(container)

    expect(scope.getByText('Week 1 Assignment')).toBeTruthy()
    expect(scope.getByRole('heading', { name: 'Two Sum' })).toBeTruthy()
    expect(scope.getByText('Solve the problem')).toBeTruthy()
    expect(scope.getByTestId('problem-solution-form')).toBeTruthy()
    expect(scope.queryByTestId('problem-submitted-summary')).toBeNull()
  })

  it('shows the submitted summary and hides the form once submitted', () => {
    const { container } = render(
      <ProblemDetailPage
        detail={detail({
          canSubmit: false,
          solution: {
            id: 7,
            submissionLink: 'https://x.test/answer',
            submittedAtLabel: '20 May, 10:00 AM',
          },
        })}
      />,
    )
    const scope = within(container)

    const summary = scope.getByTestId('problem-submitted-summary')
    expect(summary.textContent).toContain('20 May, 10:00 AM')
    expect(within(summary).getByText('https://x.test/answer')).toBeTruthy()
    expect(scope.queryByTestId('problem-solution-form')).toBeNull()
  })

  it('renders only instructions for BUTTON problems (no submission)', () => {
    const { container } = render(
      <ProblemDetailPage
        detail={detail({
          type: 'BUTTON',
          acceptsSubmission: false,
          canSubmit: false,
        })}
      />,
    )
    const scope = within(container)

    expect(scope.getByTestId('problem-statement')).toBeTruthy()
    expect(scope.queryByTestId('problem-solution-form')).toBeNull()
  })
})
