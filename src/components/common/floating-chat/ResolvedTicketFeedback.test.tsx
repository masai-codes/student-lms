// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResolvedTicketFeedback } from './ResolvedTicketFeedback'

afterEach(cleanup)

function renderFeedback() {
  const onSubmitRating = vi.fn().mockResolvedValue(undefined)
  const onReopenEscalate = vi.fn().mockResolvedValue(undefined)
  render(
    <ResolvedTicketFeedback
      onSubmitRating={onSubmitRating}
      onReopenEscalate={onReopenEscalate}
    />,
  )
  return { onSubmitRating, onReopenEscalate }
}

describe('ResolvedTicketFeedback', () => {
  it('requires a reason or comment before submitting positive feedback', async () => {
    const { onSubmitRating } = renderFeedback()

    fireEvent.click(screen.getByTestId('support-feedback-rating-up'))
    const submit = screen.getByTestId('support-feedback-submit')
    expect(submit.disabled).toBe(true)

    fireEvent.change(screen.getByTestId('support-feedback-comment'), {
      target: { value: '  Helpful answer  ' },
    })
    expect(submit.disabled).toBe(false)
    fireEvent.click(submit)

    await waitFor(() =>
      expect(onSubmitRating).toHaveBeenCalledWith({
        rating: 5,
        reasons: [],
        comment: 'Helpful answer',
      }),
    )
  })

  it('requires feedback before submit or reopen and accepts a selected reason', async () => {
    const { onSubmitRating, onReopenEscalate } = renderFeedback()

    fireEvent.click(screen.getByTestId('support-feedback-rating-down'))
    expect(screen.getByTestId('support-feedback-submit').disabled).toBe(true)
    expect(
      screen.getByTestId('support-feedback-reopen-escalate').disabled,
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Issue not solved' }))
    fireEvent.click(screen.getByTestId('support-feedback-reopen-escalate'))

    await waitFor(() =>
      expect(onReopenEscalate).toHaveBeenCalledWith({
        reasons: ['Issue not solved'],
        comment: '',
      }),
    )
    expect(onSubmitRating).not.toHaveBeenCalled()
  })
})
