// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLectureAiChatFeedback } from '../useLectureAiChatFeedback'

const hoisted = vi.hoisted(() => ({
  submitLectureAiChatFeedback: vi.fn(),
}))

vi.mock('@/lib/api/ai-tutor/lectureAiChatFeedbackApi', () => ({
  submitLectureAiChatFeedback: hoisted.submitLectureAiChatFeedback,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useLectureAiChatFeedback', () => {
  it('shows the modal when notified of a completed first reply', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(42))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.chatId).toBe(42)
  })

  it('ignores a null chatId', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(null))

    expect(result.current.isVisible).toBe(false)
  })

  it('submits feedback and closes the modal, preventing re-prompt for the same chatId', async () => {
    hoisted.submitLectureAiChatFeedback.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(7))
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
    expect(result.current.isVisible).toBe(false)
  })

  it('keeps the modal open and shows an error when submit fails', async () => {
    hoisted.submitLectureAiChatFeedback.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(7))
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
    act(() => result.current.skip())

    expect(result.current.isVisible).toBe(false)

    act(() => result.current.notifyFirstReplyCompleted(9))
    expect(result.current.isVisible).toBe(false)
  })

  it('allows prompting again for a new chatId after a skip', () => {
    const { result } = renderHook(() => useLectureAiChatFeedback(1))

    act(() => result.current.notifyFirstReplyCompleted(9))
    act(() => result.current.skip())
    act(() => result.current.notifyFirstReplyCompleted(10))

    expect(result.current.isVisible).toBe(true)
    expect(result.current.chatId).toBe(10)
  })
})
