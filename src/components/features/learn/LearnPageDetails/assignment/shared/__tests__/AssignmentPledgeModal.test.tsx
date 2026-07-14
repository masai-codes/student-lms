// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AssignmentPledgeModal } from '../AssignmentPledgeModal'

const hoisted = vi.hoisted(() => ({
  createAssignmentSubmission: vi.fn(),
  invalidate: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/assignmentDetailActionsApi', () => ({
  createAssignmentSubmission: hoisted.createAssignmentSubmission,
}))
vi.mock('@/utils/gtm', () => ({
  pushGtmEvent: hoisted.pushGtmEvent,
}))

afterEach(cleanup)

describe('AssignmentPledgeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.createAssignmentSubmission.mockResolvedValue({ id: 1 })
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('renders the pledge as an open modal with the legacy copy', () => {
    render(<AssignmentPledgeModal assignmentId={42} />)

    expect(screen.getByTestId('assignment-pledge-modal')).toBeTruthy()
    expect(screen.getByText('Integrity')).toBeTruthy()
    expect(screen.getByText('No Cheat Code To Success')).toBeTruthy()
    expect(screen.getByText(/there is no cheat code to success/i)).toBeTruthy()
  })

  it('cannot be dismissed with Escape (forced acknowledgement)', () => {
    render(<AssignmentPledgeModal assignmentId={42} />)

    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' })

    expect(screen.getByTestId('assignment-pledge-modal')).toBeTruthy()
  })

  it('keeps confirm disabled until the pledge is accepted', () => {
    render(<AssignmentPledgeModal assignmentId={42} />)

    expect(
      screen.getByTestId('assignment-pledge-confirm').hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(screen.getByRole('checkbox'))

    expect(
      screen.getByTestId('assignment-pledge-confirm').hasAttribute('disabled'),
    ).toBe(false)
  })

  it('creates the submission, tracks the event and refreshes on confirm', async () => {
    render(<AssignmentPledgeModal assignmentId={42} />)

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByTestId('assignment-pledge-confirm'))

    await waitFor(() => {
      expect(hoisted.createAssignmentSubmission).toHaveBeenCalledWith(42)
      expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
    })
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_learn_assignment_pledge_confirm_id_42',
      { assignment_id: 42 },
    )
  })

  it('shows an error message and does not refresh when submission creation fails', async () => {
    hoisted.createAssignmentSubmission.mockRejectedValueOnce(
      new Error('SUBMISSION_EXISTS'),
    )
    render(<AssignmentPledgeModal assignmentId={42} />)

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByTestId('assignment-pledge-confirm'))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'SUBMISSION_EXISTS',
      )
    })
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('falls back to a generic message when a non-Error is thrown', async () => {
    hoisted.createAssignmentSubmission.mockRejectedValueOnce('boom')
    render(<AssignmentPledgeModal assignmentId={42} />)

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByTestId('assignment-pledge-confirm'))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not start the assignment',
      )
    })
  })
})
