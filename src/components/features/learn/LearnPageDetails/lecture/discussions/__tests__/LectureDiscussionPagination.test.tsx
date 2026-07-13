// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureDiscussionPagination } from '../LectureDiscussionPagination'

const hoisted = vi.hoisted(() => ({ pushLearnEvent: vi.fn() }))

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
}))

describe('LectureDiscussionPagination', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <LectureDiscussionPagination
        entityId={1}
        entityKind="lecture"
        page={1}
        totalPages={1}
        filteredCount={5}
        pageSize={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows the current range summary', () => {
    const { container } = render(
      <LectureDiscussionPagination
        entityId={1}
        entityKind="lecture"
        page={2}
        totalPages={3}
        filteredCount={25}
        pageSize={10}
        onPageChange={vi.fn()}
      />,
    )
    expect(
      within(container).getByTestId('discussion-pagination-summary').textContent,
    ).toContain('Showing 11')
    expect(
      within(container).getByTestId('discussion-pagination-summary').textContent,
    ).toContain('20 of 25')
  })

  it('changes page and fires an analytics event', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <LectureDiscussionPagination
        entityId={7}
        entityKind="assignment"
        page={1}
        totalPages={3}
        filteredCount={25}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    )
    fireEvent.click(within(container).getByLabelText('Go to page 2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_discussion_page_change',
      { entity_id: 7, entity_kind: 'assignment', page: 2 },
    )
  })
})
