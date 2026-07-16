// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLectureAiChat } from '../useLectureAiChat'
import type { ReactNode } from 'react'

const hoisted = vi.hoisted(() => ({
  streamLectureAiChat: vi.fn(),
  getAiTutorConversation: vi.fn(),
  listAiTutorConversations: vi.fn(),
}))

vi.mock('@/lib/api/ai-tutor/streamAiTutorChat', () => ({
  streamLectureAiChat: hoisted.streamLectureAiChat,
}))

vi.mock('@/lib/api/ai-tutor/aiTutorChatApi', () => ({
  getAiTutorConversation: hoisted.getAiTutorConversation,
  listAiTutorConversations: hoisted.listAiTutorConversations,
}))

type CapturedHandlers = {
  onFirstChunk?: () => void
  onChunk: (token: string) => void
  onComplete: (chatId: number | null) => void
  onError: (code: string) => void
}

let lastHandlers: CapturedHandlers | null = null
let lastRequest: Record<string, unknown> | null = null
const abort = vi.fn()

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

function renderChat(
  lectureId = 1,
  platform: 'web-desktop' | 'web-mobile' = 'web-desktop',
  onFirstReplyInNewThreadCompleted?: (chatId: number) => void,
) {
  return renderHook(
    () =>
      useLectureAiChat(lectureId, platform, onFirstReplyInNewThreadCompleted),
    { wrapper: createWrapper() },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  lastHandlers = null
  lastRequest = null
  hoisted.streamLectureAiChat.mockImplementation(
    (request: Record<string, unknown>, handlers: CapturedHandlers) => {
      lastRequest = request
      lastHandlers = handlers
      return abort
    },
  )
})

describe('useLectureAiChat', () => {
  it('appends user + assistant messages and streams a reply', () => {
    const { result } = renderChat(42)

    act(() => {
      result.current.sendMessage('hello')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'hello',
      status: 'sent',
    })
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      status: 'thinking',
    })
    expect(result.current.isSending).toBe(true)
    expect(lastRequest).toEqual({
      lectureId: 42,
      chat: 'hello',
      platform: 'web-desktop',
      language: 'English',
    })

    act(() => lastHandlers!.onFirstChunk?.())
    act(() => lastHandlers!.onChunk('Hi '))
    act(() => lastHandlers!.onChunk('there'))

    expect(result.current.messages[1]).toMatchObject({
      status: 'streaming',
      content: 'Hi there',
    })

    act(() => lastHandlers!.onComplete(7))

    expect(result.current.messages[1].status).toBe('completed')
    expect(result.current.isSending).toBe(false)
    expect(result.current.activeChatId).toBe(7)
  })

  it('passes web-mobile platform when provided', () => {
    const { result } = renderChat(1, 'web-mobile')

    act(() => {
      result.current.sendMessage('hello')
    })

    expect(lastRequest).toEqual({
      lectureId: 1,
      chat: 'hello',
      platform: 'web-mobile',
      language: 'English',
    })
  })

  it('defaults to English, sends, and persists the selected reply language', () => {
    const { result } = renderChat()

    expect(result.current.language).toBe('English')

    act(() => result.current.setLanguage('Hindi'))
    expect(result.current.language).toBe('Hindi')
    expect(window.localStorage.getItem('lecture-ai-chat:language')).toBe(
      'Hindi',
    )

    act(() => result.current.sendMessage('hello'))

    expect(lastRequest).toMatchObject({ language: 'Hindi' })
  })

  it('initializes the reply language from a persisted value', () => {
    window.localStorage.setItem('lecture-ai-chat:language', 'Tamil')

    const { result } = renderChat()

    expect(result.current.language).toBe('Tamil')

    act(() => result.current.sendMessage('hello'))
    expect(lastRequest).toMatchObject({ language: 'Tamil' })
  })

  it('falls back to English when the persisted language is unknown', () => {
    window.localStorage.setItem('lecture-ai-chat:language', 'Klingon')

    const { result } = renderChat()

    expect(result.current.language).toBe('English')
  })

  it('reuses the returned chatId on the next message', () => {
    const { result } = renderChat()

    act(() => result.current.sendMessage('first'))
    act(() => lastHandlers!.onComplete(99))
    act(() => result.current.sendMessage('second'))

    expect(lastRequest).toEqual({
      lectureId: 1,
      chat: 'second',
      platform: 'web-desktop',
      language: 'English',
      chatId: 99,
    })
  })

  it('marks the assistant message as error and retries without a new user turn', () => {
    const { result } = renderChat()

    act(() => result.current.sendMessage('boom'))
    act(() => lastHandlers!.onError('AI_TUTOR_ANTHROPIC_NOT_CONFIGURED'))

    expect(result.current.messages[1].status).toBe('error')
    expect(result.current.isSending).toBe(false)
    expect(result.current.errorCode).toBe('AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')

    act(() => result.current.retryLast())

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].status).toBe('thinking')
    expect(result.current.isSending).toBe(true)
  })

  it('ignores empty sends and blocks while a stream is in flight', () => {
    const { result } = renderChat()

    act(() => result.current.sendMessage('   '))
    expect(result.current.messages).toHaveLength(0)

    act(() => result.current.sendMessage('one'))
    act(() => result.current.sendMessage('two'))

    expect(result.current.messages).toHaveLength(2)
  })

  it('stop() aborts the stream and settles the pending assistant message', () => {
    const { result } = renderChat()

    act(() => result.current.sendMessage('hi'))
    act(() => lastHandlers!.onChunk('partial answer'))
    act(() => result.current.stop())

    expect(abort).toHaveBeenCalled()
    expect(result.current.isSending).toBe(false)
    expect(result.current.messages[1].status).toBe('completed')
  })

  it('loads a past conversation and continues its thread', async () => {
    hoisted.getAiTutorConversation.mockResolvedValue({
      chatId: 5,
      chat: [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
      ],
    })

    const { result } = renderChat(1)

    await act(async () => {
      await result.current.selectConversation(5)
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'earlier question',
      status: 'sent',
    })
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'earlier answer',
      status: 'completed',
    })
    expect(result.current.activeChatId).toBe(5)
    expect(result.current.isLoadingConversation).toBe(false)

    act(() => result.current.sendMessage('follow up'))
    expect(lastRequest).toEqual({
      lectureId: 1,
      chat: 'follow up',
      platform: 'web-desktop',
      language: 'English',
      chatId: 5,
    })
  })

  it('fires onFirstReplyInNewThreadCompleted once the first message of a new thread completes', () => {
    const onFirstReply = vi.fn()
    const { result } = renderChat(1, 'web-desktop', onFirstReply)

    act(() => result.current.sendMessage('hello'))
    act(() => lastHandlers!.onComplete(7))

    expect(onFirstReply).toHaveBeenCalledTimes(1)
    expect(onFirstReply).toHaveBeenCalledWith(7)
  })

  it('does not fire onFirstReplyInNewThreadCompleted for follow-up messages in the same thread', () => {
    const onFirstReply = vi.fn()
    const { result } = renderChat(1, 'web-desktop', onFirstReply)

    act(() => result.current.sendMessage('first'))
    act(() => lastHandlers!.onComplete(7))
    act(() => result.current.sendMessage('second'))
    act(() => lastHandlers!.onComplete(7))

    expect(onFirstReply).toHaveBeenCalledTimes(1)
  })

  it('does not fire onFirstReplyInNewThreadCompleted for a thread loaded from history', async () => {
    hoisted.getAiTutorConversation.mockResolvedValue({
      chatId: 5,
      chat: [{ role: 'user', content: 'earlier question' }],
    })
    const onFirstReply = vi.fn()
    const { result } = renderChat(1, 'web-desktop', onFirstReply)

    await act(async () => {
      await result.current.selectConversation(5)
    })
    act(() => result.current.sendMessage('follow up'))
    act(() => lastHandlers!.onComplete(5))

    expect(onFirstReply).not.toHaveBeenCalled()
  })

  it('re-arms first-reply eligibility after startNewChat', () => {
    const onFirstReply = vi.fn()
    const { result } = renderChat(1, 'web-desktop', onFirstReply)

    act(() => result.current.sendMessage('first'))
    act(() => lastHandlers!.onComplete(7))
    act(() => result.current.startNewChat())
    act(() => result.current.sendMessage('second'))
    act(() => lastHandlers!.onComplete(8))

    expect(onFirstReply).toHaveBeenCalledTimes(2)
    expect(onFirstReply).toHaveBeenNthCalledWith(2, 8)
  })
})
