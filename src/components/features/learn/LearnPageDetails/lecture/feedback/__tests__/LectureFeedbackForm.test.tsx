// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
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
    hoisted.submit.mockResolvedValue({
      mode: 'zef',
      rating: 5,
      text: null,
      tags: [],
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing when the window is closed and nothing was submitted', () => {
    const { container } = render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'legacy',
          canSubmit: false,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows a read-only summary when closed but already rated', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: false,
          rating: 4,
          text: 'Helpful',
          tags: ['Great examples'],
        }}
      />,
    )
    expect(screen.getByText('Your feedback')).toBeTruthy()
    expect(screen.getByText('Helpful')).toBeTruthy()
    expect(screen.getByText('Great examples')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Submit feedback/ })).toBeNull()
  })

  it('disables submit until a rating is chosen', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )
    const submit = screen.getByRole('button', { name: 'Submit feedback' })
    expect(submit.hasAttribute('disabled')).toBe(true)
  })

  it('shows no tag options until a rating is chosen', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )
    expect(screen.queryByRole('group', { name: 'Feedback tags' })).toBeNull()
  })

  it('never shows tag options in legacy mode, even with a rating chosen', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'legacy',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Amazing (5 out of 5)' }))
    expect(screen.queryByRole('group', { name: 'Feedback tags' })).toBeNull()
    expect(screen.queryByText('Clear & concise')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))
    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 5,
      feedback: undefined,
      tags: [],
    })
  })

  it('submits the selected rating and shows a success toast', async () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Amazing (5 out of 5)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 5,
      feedback: undefined,
      tags: [],
    })
    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith(
        'Thanks for your feedback!',
      ),
    )
  })

  it('shows the high-rating tag set for a 5 and allows selecting multiple', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Amazing (5 out of 5)' }))
    expect(screen.getByText('Clear & concise')).toBeTruthy()
    expect(screen.queryByText('Too fast')).toBeNull()

    fireEvent.click(screen.getByText('Clear & concise'))
    fireEvent.click(screen.getByText('Very engaging'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 5,
      feedback: undefined,
      tags: ['Clear & concise', 'Very engaging'],
    })
  })

  it('shows the low-rating tag set for a 2 and toggles a tag off on repeat click', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Meh (2 out of 5)' }))
    expect(screen.getByText('Too slow')).toBeTruthy()
    expect(screen.queryByText('Clear & concise')).toBeNull()

    fireEvent.click(screen.getByText('Too slow'))
    fireEvent.click(screen.getByText('Too slow'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 2,
      feedback: undefined,
      tags: [],
    })
  })

  it('resets tag selection when the rating changes', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: null,
          text: null,
          tags: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Meh (2 out of 5)' }))
    fireEvent.click(screen.getByText('Too slow'))
    fireEvent.click(screen.getByRole('radio', { name: 'Amazing (5 out of 5)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 5,
      feedback: undefined,
      tags: [],
    })
  })

  it('prefills an existing rating and labels the button as update', () => {
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: 3,
          text: 'ok',
          tags: [],
        }}
      />,
    )

    const update = screen.getByRole('button', { name: 'Update feedback' })
    fireEvent.click(update)

    expect(hoisted.submit).toHaveBeenCalledWith({
      lectureId: 572,
      rating: 3,
      feedback: 'ok',
      tags: [],
    })
  })

  it('shows an error toast when submission fails', async () => {
    hoisted.submit.mockRejectedValueOnce(new Error('FEEDBACK_WINDOW_CLOSED'))
    render(
      <LectureFeedbackForm
        lectureId={572}
        feedback={{
          mode: 'zef',
          canSubmit: true,
          rating: 2,
          text: null,
          tags: [],
        }}
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
