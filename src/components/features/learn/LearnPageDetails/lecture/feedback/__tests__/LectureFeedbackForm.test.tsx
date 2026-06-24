// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureFeedbackForm } from '../LectureFeedbackForm'

const hoisted = vi.hoisted(() => ({
  submit: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/api/learn/lectureFeedbackApi', () => ({
  submitLectureFeedbackViaApi: hoisted.submit,
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: hoisted.toastSuccess, error: hoisted.toastError },
}))

describe('LectureFeedbackForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.submit.mockResolvedValue({ rating: 5, text: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing when the window is closed and nothing was submitted', () => {
    const { container } = render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: false, rating: null, text: null }}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows a read-only summary when closed but already rated', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: false, rating: 4, text: 'Helpful' }}
      />,
    )
    expect(screen.getByText('Your feedback')).toBeTruthy()
    expect(screen.getByText('Helpful')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Submit feedback/ })).toBeNull()
  })

  it('disables submit until a rating is chosen', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: true, rating: null, text: null }}
      />,
    )
    const submit = screen.getByRole('button', { name: 'Submit feedback' })
    expect(submit.hasAttribute('disabled')).toBe(true)
  })

  it('submits the selected rating and shows a success toast', async () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: true, rating: null, text: null }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Rate 5 stars' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 5,
      feedback: undefined,
    })
    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith(
        'Thanks for your feedback!',
      ),
    )
  })

  it('prefills an existing rating and labels the button as update', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: true, rating: 3, text: 'ok' }}
      />,
    )

    const update = screen.getByRole('button', { name: 'Update feedback' })
    fireEvent.click(update)

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 3,
      feedback: 'ok',
    })
  })

  it('shows an error toast when submission fails', async () => {
    hoisted.submit.mockRejectedValueOnce(new Error('FEEDBACK_WINDOW_CLOSED'))
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{ canSubmit: true, rating: 2, text: null }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Update feedback' }))

    await waitFor(() =>
      expect(hoisted.toastError).toHaveBeenCalledWith(
        'Could not submit feedback. Please try again.',
      ),
    )
  })
})
