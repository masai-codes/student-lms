// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureAiChatPanel } from '../LectureAiChatPanel'
import type { UseLectureAiChatResult } from '../../hooks/useLectureAiChat'

vi.mock('../../hooks/useLectureAiConversations', () => ({
  useLectureAiConversations: () => ({
    data: { conversations: [] },
    isLoading: false,
    isError: false,
  }),
}))
vi.mock('../LectureAiChatComposer', () => ({
  LectureAiChatComposer: () => <div data-testid="composer" />,
}))
vi.mock('../LectureAiChatMessageList', () => ({
  LectureAiChatMessageList: () => <div data-testid="messages" />,
}))
vi.mock('../LectureAiChatHistoryList', () => ({
  LectureAiChatHistoryList: () => <div data-testid="history" />,
}))
vi.mock('../LectureAiChatFeedbackBanner', () => ({
  LectureAiChatFeedbackBanner: () => <div data-testid="feedback" />,
}))

function makeChat(
  overrides: Partial<UseLectureAiChatResult> = {},
): UseLectureAiChatResult {
  return {
    messages: [],
    input: '',
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    stop: vi.fn(),
    retryLast: vi.fn(),
    isSending: false,
    isLoadingConversation: false,
    activeChatId: null,
    selectConversation: vi.fn(),
    startNewChat: vi.fn(),
    language: 'en',
    setLanguage: vi.fn(),
    ...overrides,
  } as UseLectureAiChatResult
}

describe('LectureAiChatPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the title, messages and composer by default', () => {
    render(<LectureAiChatPanel chat={makeChat()} lectureId={1} />)

    expect(screen.getByText('AI Tutor')).toBeTruthy()
    expect(screen.getByTestId('messages')).toBeTruthy()
    expect(screen.getByTestId('composer')).toBeTruthy()
    expect(screen.queryByTestId('lecture-ask-ai-expand-toggle')).toBeNull()
  })

  it('shows a maximize control that toggles and reflects expansion', () => {
    const onToggleExpand = vi.fn()
    const { rerender } = render(
      <LectureAiChatPanel
        chat={makeChat()}
        lectureId={1}
        onToggleExpand={onToggleExpand}
        isExpanded={false}
      />,
    )

    const toggle = screen.getByTestId('lecture-ask-ai-expand-toggle')
    expect(toggle.getAttribute('aria-label')).toBe('Maximize chat')
    fireEvent.click(toggle)
    expect(onToggleExpand).toHaveBeenCalledTimes(1)

    rerender(
      <LectureAiChatPanel
        chat={makeChat()}
        lectureId={1}
        onToggleExpand={onToggleExpand}
        isExpanded
      />,
    )
    expect(
      screen.getByTestId('lecture-ask-ai-expand-toggle').getAttribute('aria-label'),
    ).toBe('Minimize chat')
  })

  it('closes via the close control', () => {
    const onClose = vi.fn()
    render(<LectureAiChatPanel chat={makeChat()} lectureId={1} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close chat' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the new-chat control once a thread has messages', () => {
    const startNewChat = vi.fn()
    render(
      <LectureAiChatPanel
        chat={makeChat({
          messages: [{ id: '1' }] as unknown as UseLectureAiChatResult['messages'],
          startNewChat,
        })}
        lectureId={1}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    expect(startNewChat).toHaveBeenCalledTimes(1)
  })

  it('opens history, hiding the composer and messages', () => {
    render(<LectureAiChatPanel chat={makeChat()} lectureId={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'Chat history' }))

    expect(screen.getByTestId('history')).toBeTruthy()
    expect(screen.queryByTestId('composer')).toBeNull()
    expect(screen.queryByTestId('messages')).toBeNull()
  })

  it('renders a loading state while a conversation is fetched', () => {
    render(
      <LectureAiChatPanel
        chat={makeChat({ isLoadingConversation: true })}
        lectureId={1}
      />,
    )

    expect(screen.queryByTestId('messages')).toBeNull()
    expect(screen.getByTestId('composer')).toBeTruthy()
  })

  it('renders the feedback banner when feedback is visible', () => {
    render(
      <LectureAiChatPanel
        chat={makeChat()}
        lectureId={1}
        feedback={
          {
            isVisible: true,
            isSubmitting: false,
            submitError: null,
            submit: vi.fn(),
            skip: vi.fn(),
          } as never
        }
      />,
    )

    expect(screen.getByTestId('feedback')).toBeTruthy()
  })
})
