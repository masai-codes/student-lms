// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProblemSolutionForm } from '../ProblemSolutionForm'
import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'

const hoisted = vi.hoisted(() => ({
  submitSolutionLink: vi.fn(),
  uploadSolutionFile: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/assignmentDetailActionsApi', () => ({
  submitSolutionLink: hoisted.submitSolutionLink,
  uploadSolutionFile: hoisted.uploadSolutionFile,
}))

function detail(
  overrides: Partial<ProblemDetailPayload> = {},
): ProblemDetailPayload {
  return {
    assignmentId: 99,
    problemId: 11,
    elementId: 1,
    assignmentTitle: 'Week 1',
    problemTitle: 'Two Sum',
    statement: 'Solve',
    type: 'LINK',
    acceptsSubmission: true,
    allowMultipleSubmissions: false,
    canSubmit: true,
    solution: { id: 7, submissionLink: null, submittedAtLabel: null },
    ...overrides,
  }
}

describe('ProblemSolutionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.submitSolutionLink.mockResolvedValue({
      status: 'submitted',
      submissionLink: 'x',
    })
    hoisted.uploadSolutionFile.mockResolvedValue({
      status: 'submitted',
      submissionLink: 'x',
    })
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('renders nothing when there is no solution row', () => {
    const { container } = render(
      <ProblemSolutionForm detail={detail({ solution: null })} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('validates the link before submitting', () => {
    const { container } = render(<ProblemSolutionForm detail={detail()} />)
    const scope = within(container)

    fireEvent.change(scope.getByTestId('problem-solution-link-input'), {
      target: { value: 'not a url' },
    })
    fireEvent.click(scope.getByTestId('problem-solution-link-submit'))

    expect(scope.getByRole('alert').textContent).toContain('valid link')
    expect(hoisted.submitSolutionLink).not.toHaveBeenCalled()
  })

  it('submits a valid link and refreshes', async () => {
    const { container } = render(<ProblemSolutionForm detail={detail()} />)
    const scope = within(container)

    fireEvent.change(scope.getByTestId('problem-solution-link-input'), {
      target: { value: 'https://x.test' },
    })
    fireEvent.click(scope.getByTestId('problem-solution-link-submit'))

    await waitFor(() => {
      expect(hoisted.submitSolutionLink).toHaveBeenCalledWith(
        7,
        'https://x.test',
      )
      expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
    })
  })

  it('uploads a chosen file for FILE problems', async () => {
    const { container } = render(
      <ProblemSolutionForm detail={detail({ type: 'FILE' })} />,
    )
    const scope = within(container)
    const file = new File(['x'], 'answer.pdf', { type: 'application/pdf' })

    fireEvent.change(scope.getByTestId('problem-solution-file-input'), {
      target: { files: [file] },
    })
    fireEvent.click(scope.getByTestId('problem-solution-file-submit'))

    await waitFor(() => {
      expect(hoisted.uploadSolutionFile).toHaveBeenCalledWith(7, file)
    })
  })

  it('surfaces a submission error', async () => {
    hoisted.submitSolutionLink.mockRejectedValueOnce(
      new Error('SOLUTION_NOT_FOUND'),
    )
    const { container } = render(<ProblemSolutionForm detail={detail()} />)
    const scope = within(container)

    fireEvent.change(scope.getByTestId('problem-solution-link-input'), {
      target: { value: 'https://x.test' },
    })
    fireEvent.click(scope.getByTestId('problem-solution-link-submit'))

    await waitFor(() => {
      expect(scope.getByRole('alert').textContent).toContain(
        'SOLUTION_NOT_FOUND',
      )
    })
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })
})
