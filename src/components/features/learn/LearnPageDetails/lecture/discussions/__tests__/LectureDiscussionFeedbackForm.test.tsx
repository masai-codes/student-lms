// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LectureDiscussionFeedbackForm } from '../LectureDiscussionFeedbackForm'

describe('LectureDiscussionFeedbackForm', () => {
  it('keeps submit disabled until a rating is picked', () => {
    const { container } = render(
      <LectureDiscussionFeedbackForm onSubmit={vi.fn()} />,
    )
    const scope = within(container)
    expect(
      scope.getByTestId('discussion-feedback-submit').hasAttribute('disabled'),
    ).toBe(true)

    fireEvent.click(scope.getByTestId('discussion-feedback-star-3'))
    expect(
      scope.getByTestId('discussion-feedback-submit').hasAttribute('disabled'),
    ).toBe(false)
  })

  it('submits the chosen rating and trimmed comment', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <LectureDiscussionFeedbackForm onSubmit={onSubmit} />,
    )
    const scope = within(container)

    fireEvent.click(scope.getByTestId('discussion-feedback-star-4'))
    fireEvent.change(scope.getByTestId('discussion-feedback-comment'), {
      target: { value: '  really helpful  ' },
    })
    fireEvent.click(scope.getByTestId('discussion-feedback-submit'))

    expect(onSubmit).toHaveBeenCalledWith(4, 'really helpful')
  })

  it('disables all controls when disabled', () => {
    const { container } = render(
      <LectureDiscussionFeedbackForm disabled onSubmit={vi.fn()} />,
    )
    const scope = within(container)
    expect(
      scope.getByTestId('discussion-feedback-star-2').hasAttribute('disabled'),
    ).toBe(true)
    expect(
      scope.getByTestId('discussion-feedback-submit').hasAttribute('disabled'),
    ).toBe(true)
  })
})
