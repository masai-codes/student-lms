// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureAiChatEmptyState } from '../LectureAiChatEmptyState'
import { useLectureAiChatSuggestions } from '../../hooks/useLectureAiChatSuggestions'
import { pushGtmEvent } from '@/utils/gtm'

vi.mock('../../hooks/useLectureAiChatSuggestions', () => ({
  useLectureAiChatSuggestions: vi.fn(),
}))
vi.mock('@/utils/gtm', () => ({
  pushGtmEvent: vi.fn(),
}))

const FIXED_SUGGESTIONS = [
  { icon: 'summary', question: 'Summarize the key points of this lecture' },
  {
    icon: 'explain',
    question: 'What are the core concepts I should understand?',
  },
  { icon: 'quiz', question: 'Quiz me on this lecture' },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useLectureAiChatSuggestions).mockReturnValue({
    data: { suggestions: FIXED_SUGGESTIONS },
  } as never)
})

afterEach(() => {
  cleanup()
})

describe('LectureAiChatEmptyState', () => {
  it('renders the fixed suggestions', () => {
    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
  })

  it('sends the suggestion text when a fixed suggestion is clicked', () => {
    const onSuggestion = vi.fn()
    render(
      <LectureAiChatEmptyState lectureId={42} onSuggestion={onSuggestion} />,
    )

    fireEvent.click(
      screen.getByText('Summarize the key points of this lecture'),
    )
    expect(onSuggestion).toHaveBeenCalledWith(
      'Summarize the key points of this lecture',
    )
  })

  it('renders lecture faqs ahead of the fixed suggestions', () => {
    vi.mocked(useLectureAiChatSuggestions).mockReturnValue({
      data: {
        suggestions: [
          { icon: 'faq', question: 'What is X?' },
          ...FIXED_SUGGESTIONS,
        ],
      },
    } as never)

    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    const faqButtons = screen.getAllByTestId('lecture-ai-chat-faq-suggestion')
    expect(faqButtons).toHaveLength(1)
    expect(faqButtons[0].textContent).toContain('What is X?')
    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
  })

  it('sends the faq question and fires a GTM event when a faq is clicked', () => {
    vi.mocked(useLectureAiChatSuggestions).mockReturnValue({
      data: {
        suggestions: [
          { icon: 'faq', question: 'What is X?' },
          ...FIXED_SUGGESTIONS,
        ],
      },
    } as never)
    const onSuggestion = vi.fn()

    render(
      <LectureAiChatEmptyState lectureId={42} onSuggestion={onSuggestion} />,
    )

    fireEvent.click(screen.getByTestId('lecture-ai-chat-faq-suggestion'))

    expect(onSuggestion).toHaveBeenCalledWith('What is X?')
    expect(pushGtmEvent).toHaveBeenCalledWith(
      'l_learn_lecture_ai_chat_faq_click_id_42',
      { question: 'What is X?' },
    )
  })

  it('renders nothing when the suggestions query has no data yet', () => {
    vi.mocked(useLectureAiChatSuggestions).mockReturnValue({
      data: undefined,
    } as never)

    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
    expect(screen.queryByTestId('lecture-ai-chat-suggestion')).toBeNull()
  })
})
