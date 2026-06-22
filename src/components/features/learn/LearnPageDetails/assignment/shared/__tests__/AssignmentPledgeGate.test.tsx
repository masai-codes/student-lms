// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AssignmentPledgeGate } from '../AssignmentPledgeGate'

const hoisted = vi.hoisted(() => ({
  createAssignmentSubmission: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/assignmentDetailActionsApi', () => ({
  createAssignmentSubmission: hoisted.createAssignmentSubmission,
}))

describe('AssignmentPledgeGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.createAssignmentSubmission.mockResolvedValue({ id: 1 })
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('keeps confirm disabled until the pledge is accepted', () => {
    const { container } = render(<AssignmentPledgeGate assignmentId={42} />)
    const scope = within(container)

    expect(
      scope.getByTestId('assignment-pledge-confirm').hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(scope.getByRole('checkbox'))

    expect(
      scope.getByTestId('assignment-pledge-confirm').hasAttribute('disabled'),
    ).toBe(false)
  })

  it('creates the submission and refreshes on confirm', async () => {
    const { container } = render(<AssignmentPledgeGate assignmentId={42} />)
    const scope = within(container)

    fireEvent.click(scope.getByRole('checkbox'))
    fireEvent.click(scope.getByTestId('assignment-pledge-confirm'))

    await waitFor(() => {
      expect(hoisted.createAssignmentSubmission).toHaveBeenCalledWith(42)
      expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an error message when submission creation fails', async () => {
    hoisted.createAssignmentSubmission.mockRejectedValueOnce(new Error('SUBMISSION_EXISTS'))
    const { container } = render(<AssignmentPledgeGate assignmentId={42} />)
    const scope = within(container)

    fireEvent.click(scope.getByRole('checkbox'))
    fireEvent.click(scope.getByTestId('assignment-pledge-confirm'))

    await waitFor(() => {
      expect(scope.getByRole('alert').textContent).toContain('SUBMISSION_EXISTS')
    })
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })
})
