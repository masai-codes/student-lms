// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureAiChatEmptyState } from '../LectureAiChatEmptyState'
import { useLectureAiChatFaqs } from '../../hooks/useLectureAiChatFaqs'
import { pushGtmEvent } from '@/utils/gtm'

vi.mock('../../hooks/useLectureAiChatFaqs', () => ({
  useLectureAiChatFaqs: vi.fn(),
}))
vi.mock('@/utils/gtm', () => ({
  pushGtmEvent: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useLectureAiChatFaqs).mockReturnValue({
    data: { faqs: [] },
  } as never)
})

afterEach(() => {
  cleanup()
})

describe('LectureAiChatEmptyState', () => {
  it('renders the static suggestions', () => {
    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
  })

  it('sends the suggestion text when a static suggestion is clicked', () => {
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

  it('renders lecture faqs ahead of the static suggestions', () => {
    vi.mocked(useLectureAiChatFaqs).mockReturnValue({
      data: {
        faqs: [{ question: 'What is X?', answer: 'X is Y.' }],
      },
    } as never)

    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    const faqButtons = screen.getAllByTestId('lecture-ai-chat-faq-suggestion')
    expect(faqButtons).toHaveLength(1)
    expect(faqButtons[0].textContent).toContain('What is X?')
  })

  it('sends the faq question and fires a GTM event when a faq is clicked', () => {
    vi.mocked(useLectureAiChatFaqs).mockReturnValue({
      data: {
        faqs: [{ question: 'What is X?', answer: 'X is Y.' }],
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

  it('renders nothing extra when the faqs query has no data yet', () => {
    vi.mocked(useLectureAiChatFaqs).mockReturnValue({
      data: undefined,
    } as never)

    render(<LectureAiChatEmptyState lectureId={42} onSuggestion={vi.fn()} />)

    expect(screen.queryByTestId('lecture-ai-chat-faq-suggestion')).toBeNull()
    expect(screen.getAllByTestId('lecture-ai-chat-suggestion')).toHaveLength(3)
  })
})
