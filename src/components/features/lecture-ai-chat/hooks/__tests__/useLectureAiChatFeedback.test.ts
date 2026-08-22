// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLectureAiChatFeedback } from '../useLectureAiChatFeedback'

const hoisted = vi.hoisted(() => ({
  submitLectureAiChatFeedback: vi.fn(),
}))

vi.mock('@/lib/api/ai-tutor/lectureAiChatFeedbackApi', () => ({
  submitLectureAiChatFeedback: hoisted.submitLectureAiChatFeedback,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useLectureAiChatFeedback', () => {
  it('shows the modal after 15s of inactivity following a completed first reply', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))
    expect(result.current.isVisible).toBe(false)

    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.chatId).toBe(42)
  })

  it('does not show the modal while the chat is still active', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))
    act(() => result.current.reportActivity('compose', true))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(false)
  })

  it('restarts the inactivity timer once activity resumes then stops', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))
    act(() => vi.advanceTimersByTime(10_000))
    act(() => result.current.reportActivity('compose', true))
    act(() => result.current.reportActivity('compose', false))
    act(() => vi.advanceTimersByTime(10_000))

    expect(result.current.isVisible).toBe(false)

    act(() => vi.advanceTimersByTime(5_000))

    expect(result.current.isVisible).toBe(true)
  })

  it('does not show the modal while the learner is scrolling the message list', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))
    act(() => result.current.reportActivity('scroll', true))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(false)
  })

  it('treats compose and scroll as independent sources — one going idle does not hide the other', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))
    // Learner is typing AND scrolling at once.
    act(() => result.current.reportActivity('compose', true))
    act(() => result.current.reportActivity('scroll', true))
    // Scrolling settles, but they're still typing — must stay suppressed.
    act(() => result.current.reportActivity('scroll', false))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(false)

    // Typing stops too — now the full inactivity window applies.
    act(() => result.current.reportActivity('compose', false))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(true)
  })

  it('ignores a null chatId', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(null))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(false)
  })

  it('submits feedback and closes the modal, preventing re-prompt for the same chatId', async () => {
    hoisted.submitLectureAiChatFeedback.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(7))
    act(() => vi.advanceTimersByTime(15_000))
    await act(async () => {
      await result.current.submit(4, 'Great explanation')
    })

    expect(hoisted.submitLectureAiChatFeedback).toHaveBeenCalledWith({
      lectureId: 1,
      chatId: 7,
      rating: 4,
      feedback: 'Great explanation',
    })
    expect(result.current.isVisible).toBe(false)

    act(() => result.current.notifyFirstReplyCompleted(7))
    act(() => vi.advanceTimersByTime(15_000))
    expect(result.current.isVisible).toBe(false)
  })

  it('keeps the modal open and shows an error when submit fails', async () => {
    hoisted.submitLectureAiChatFeedback.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(7))
    act(() => vi.advanceTimersByTime(15_000))
    await act(async () => {
      await result.current.submit(2)
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.submitError).toBe(
      'Failed to submit. Please try again or skip.',
    )
  })

  it('skip closes the modal and prevents re-prompt for the same chatId', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(9))
    act(() => vi.advanceTimersByTime(15_000))
    act(() => result.current.skip())

    expect(result.current.isVisible).toBe(false)

    act(() => result.current.notifyFirstReplyCompleted(9))
    act(() => vi.advanceTimersByTime(15_000))
    expect(result.current.isVisible).toBe(false)
  })

  it('allows prompting again for a new chatId after a skip', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(9))
    act(() => vi.advanceTimersByTime(15_000))
    act(() => result.current.skip())
    act(() => result.current.notifyFirstReplyCompleted(10))
    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.chatId).toBe(10)
  })
})
