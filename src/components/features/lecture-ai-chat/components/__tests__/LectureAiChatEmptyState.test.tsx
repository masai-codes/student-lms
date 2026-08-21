// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureAiChatEmptyState } from '../LectureAiChatEmptyState'
import { LectureAiChatSuggestionsProvider } from '../../hooks/LectureAiChatSuggestionsContext'
import { LECTURE_AI_CHAT_SUGGESTION_DEFAULTS } from '@/server/learn/utils/buildLectureAiChatSuggestions'
import type { LectureAiChatSuggestion } from '@/server/learn/utils/buildLectureAiChatSuggestions'
import { pushGtmEvent } from '@/utils/gtm'

vi.mock('@/utils/gtm', () => ({
  pushGtmEvent: vi.fn(),
}))

function renderEmptyState(
  suggestions: Array<LectureAiChatSuggestion>,
  onSuggestion = vi.fn(),
) {
  return render(
    <LectureAiChatSuggestionsProvider suggestions={suggestions}>
      <LectureAiChatEmptyState lectureId={42} onSuggestion={onSuggestion} />
    </LectureAiChatSuggestionsProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('LectureAiChatEmptyState', () => {
  it('renders the default suggestions from context', () => {
    renderEmptyState([...LECTURE_AI_CHAT_SUGGESTION_DEFAULTS])

    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
  })

  it('sends the suggestion text when a default suggestion is clicked', () => {
    const onSuggestion = vi.fn()
    renderEmptyState([...LECTURE_AI_CHAT_SUGGESTION_DEFAULTS], onSuggestion)

    fireEvent.click(
      screen.getByText('Summarize the key points of this lecture'),
    )
    expect(onSuggestion).toHaveBeenCalledWith(
      'Summarize the key points of this lecture',
    )
  })

  it('renders lecture faqs ahead of the default suggestions', () => {
    renderEmptyState([
      { kind: 'faq', question: 'What is X?' },
      ...LECTURE_AI_CHAT_SUGGESTION_DEFAULTS,
    ])

    const faqButtons = screen.getAllByTestId('lecture-ai-chat-faq-suggestion')
    expect(faqButtons).toHaveLength(1)
    expect(faqButtons[0].textContent).toContain('What is X?')
    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
  })

  it('sends the faq question and fires a GTM event when a faq is clicked', () => {
    const onSuggestion = vi.fn()
    renderEmptyState(
      [
        { kind: 'faq', question: 'What is X?' },
        ...LECTURE_AI_CHAT_SUGGESTION_DEFAULTS,
      ],
      onSuggestion,
    )

    fireEvent.click(screen.getByTestId('lecture-ai-chat-faq-suggestion'))

    expect(onSuggestion).toHaveBeenCalledWith('What is X?')
    expect(pushGtmEvent).toHaveBeenCalledWith(
      'l_learn_lecture_ai_chat_faq_click_id_42',
      { question: 'What is X?' },
    )
  })

  it('renders no suggestion chips when the context list is empty', () => {
    renderEmptyState([])

    expect(screen.queryByTestId('lecture-ai-chat-suggestions')).toBeNull()
    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
    expect(screen.queryByTestId('lecture-ai-chat-suggestion')).toBeNull()
    expect(screen.getByText('Ask about this lecture')).toBeTruthy()
  })
})
