// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureDiscussionListToolbar } from '../LectureDiscussionListToolbar'

const hoisted = vi.hoisted(() => ({ pushLearnEvent: vi.fn() }))

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
}))

function renderToolbar(
  props: Partial<Parameters<typeof LectureDiscussionListToolbar>[0]> = {},
) {
  const onSearchChange = vi.fn()
  const onToggleMineOnly = vi.fn()
  const utils = render(
    <LectureDiscussionListToolbar
      entityId={42}
      entityKind="lecture"
      search=""
      onSearchChange={onSearchChange}
      mineOnly={false}
      onToggleMineOnly={onToggleMineOnly}
      {...props}
    />,
  )
  return { ...utils, onSearchChange, onToggleMineOnly }
}

describe('LectureDiscussionListToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('reports typed search text to the parent', () => {
    const { container, onSearchChange } = renderToolbar()
    const input = within(container).getByTestId('discussion-search-input')
    fireEvent.change(input, { target: { value: 'react' } })
    expect(onSearchChange).toHaveBeenCalledWith('react')
  })

  it('toggles the mine filter and fires an analytics event', () => {
    const { container, onToggleMineOnly } = renderToolbar()
    const toggle = within(container).getByTestId('discussion-mine-toggle')
    expect(toggle.getAttribute('role')).toBe('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)

    expect(onToggleMineOnly).toHaveBeenCalledTimes(1)
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_discussion_mine_toggle',
      { entity_id: 42, entity_kind: 'lecture', enabled: true },
    )
  })

  it('reflects the active checked state', () => {
    const { container } = renderToolbar({ mineOnly: true })
    expect(
      within(container)
        .getByTestId('discussion-mine-toggle')
        .getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('fires a debounced search event only for a non-empty query', () => {
    const { rerender } = renderToolbar({ search: '' })
    vi.advanceTimersByTime(600)
    expect(hoisted.pushLearnEvent).not.toHaveBeenCalled()

    rerender(
      <LectureDiscussionListToolbar
        entityId={42}
        entityKind="lecture"
        search="react"
        onSearchChange={vi.fn()}
        mineOnly={false}
        onToggleMineOnly={vi.fn()}
      />,
    )
    vi.advanceTimersByTime(600)
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_discussion_search',
      {
        entity_id: 42,
        entity_kind: 'lecture',
        query_length: 5,
      },
    )
  })
})
