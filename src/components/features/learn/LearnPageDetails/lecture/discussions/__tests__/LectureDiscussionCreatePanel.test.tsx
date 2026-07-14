// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureDiscussionCreatePanel } from '../LectureDiscussionCreatePanel'

const hoisted = vi.hoisted(() => ({ pushLearnEvent: vi.fn() }))

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
}))
vi.mock('../LectureDiscussionCreateForm', () => ({
  LectureDiscussionCreateForm: () => <div data-testid="create-form" />,
}))

describe('LectureDiscussionCreatePanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the form inline when accordion is off', () => {
    const { container } = render(
      <LectureDiscussionCreatePanel
        entityId={1}
        entityKind="lecture"
        pending={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('create-form')).toBeTruthy()
    expect(scope.queryByTestId('discussion-create-toggle')).toBeNull()
  })

  it('shows the error message when provided', () => {
    const { container } = render(
      <LectureDiscussionCreatePanel
        entityId={1}
        entityKind="lecture"
        pending={false}
        error="Could not post your discussion. Try again."
        onSubmit={vi.fn()}
      />,
    )
    expect(within(container).getByRole('alert').textContent).toContain(
      'Could not post',
    )
  })

  it('collapses the form behind an accordion and fires a toggle event', () => {
    const { container } = render(
      <LectureDiscussionCreatePanel
        entityId={9}
        entityKind="assignment"
        pending={false}
        error={null}
        onSubmit={vi.fn()}
        useAccordion
      />,
    )
    const scope = within(container)
    const toggle = scope.getByTestId('discussion-create-toggle')
    expect(scope.queryByTestId('create-form')).toBeNull()

    fireEvent.click(toggle)

    expect(scope.getByTestId('create-form')).toBeTruthy()
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_discussion_create_form_toggle',
      { entity_id: 9, entity_kind: 'assignment' },
    )
  })
})
