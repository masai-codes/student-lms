// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureAiChatMessageList } from '../LectureAiChatMessageList'

vi.mock('../LectureAiChatEmptyState', () => ({
  LectureAiChatEmptyState: () => <div data-testid="empty-state" />,
}))
vi.mock('../LectureAiChatMessage', () => ({
  LectureAiChatMessage: () => <div data-testid="message" />,
}))

const noop = () => {}

describe('LectureAiChatMessageList scroll activity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('reports scrolling as active, then inactive once idle', () => {
    const onScrollActivityChange = vi.fn()
    render(
      <LectureAiChatMessageList
        lectureId={1}
        messages={[]}
        isSending={false}
        onRetry={noop}
        onSuggestion={noop}
        onSubmitPracticeQuestionAnswers={noop}
        onScrollActivityChange={onScrollActivityChange}
      />,
    )

    const list = screen.getByTestId('empty-state').parentElement!
    fireEvent.scroll(list)

    expect(onScrollActivityChange).toHaveBeenCalledTimes(1)
    expect(onScrollActivityChange).toHaveBeenCalledWith(true)

    vi.advanceTimersByTime(399)
    expect(onScrollActivityChange).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    expect(onScrollActivityChange).toHaveBeenCalledTimes(2)
    expect(onScrollActivityChange).toHaveBeenLastCalledWith(false)
  })

  it('collapses a burst of scroll events into a single active report', () => {
    const onScrollActivityChange = vi.fn()
    render(
      <LectureAiChatMessageList
        lectureId={1}
        messages={[]}
        isSending={false}
        onRetry={noop}
        onSuggestion={noop}
        onSubmitPracticeQuestionAnswers={noop}
        onScrollActivityChange={onScrollActivityChange}
      />,
    )

    const list = screen.getByTestId('empty-state').parentElement!
    fireEvent.scroll(list)
    vi.advanceTimersByTime(200)
    fireEvent.scroll(list)
    vi.advanceTimersByTime(200)
    fireEvent.scroll(list)

    // Still within the idle window after each event — never reported inactive.
    expect(onScrollActivityChange).toHaveBeenCalledTimes(1)
    expect(onScrollActivityChange).toHaveBeenCalledWith(true)

    vi.advanceTimersByTime(400)
    expect(onScrollActivityChange).toHaveBeenCalledTimes(2)
    expect(onScrollActivityChange).toHaveBeenLastCalledWith(false)
  })

  it('reports inactive on unmount if it unmounts mid-scroll', () => {
    const onScrollActivityChange = vi.fn()
    const { unmount } = render(
      <LectureAiChatMessageList
        lectureId={1}
        messages={[]}
        isSending={false}
        onRetry={noop}
        onSuggestion={noop}
        onSubmitPracticeQuestionAnswers={noop}
        onScrollActivityChange={onScrollActivityChange}
      />,
    )

    const list = screen.getByTestId('empty-state').parentElement!
    fireEvent.scroll(list)
    expect(onScrollActivityChange).toHaveBeenLastCalledWith(true)

    unmount()

    expect(onScrollActivityChange).toHaveBeenLastCalledWith(false)
  })
})
