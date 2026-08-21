import { describe, expect, it } from 'vitest'
import type { LectureChatMaterials } from '@/server/api/ai-tutor/types/lectureChatMaterials'
import {
  AI_TUTOR_LECTURE_CHAT_RAG_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE,
  AI_TUTOR_LECTURE_RAG_TOOL_NAME,
  AI_TUTOR_PRACTICE_QUESTIONS_PLAIN_TEXT_GUIDANCE,
  AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME,
  buildEnforcedChatLanguageInstruction,
} from '@/server/api/ai-tutor/constants'
import { AI_TUTOR_DEFAULT_CHAT_LANGUAGE } from '@/server/api/ai-tutor/chatLanguage'
import {
  buildLectureChatMessages,
  buildLectureChatSystemPrompt,
} from '@/server/api/ai-tutor/services/buildLectureChatPrompt'

const inlineMaterials: LectureChatMaterials = {
  lectureId: 12,
  title: 'React Hooks Deep Dive',
  summary: 'The lecture covered React hooks.',
  resourcesShared: [
    {
      url: 'https://example.com/hooks-cheatsheet',
      count: 1,
      postedBy: 'Instructor',
      timestamp: '00:12:00',
      resolvedTo: null,
    },
  ],
  notesRagged: false,
  notesInline: 'useState stores component state.',
  notesOutline: null,
  notesCharacterCount: 32,
  ragRetrievalAvailable: false,
}

const raggedMaterials: LectureChatMaterials = {
  lectureId: 12,
  title: 'Sorting Algorithms',
  summary: 'The lecture covered sorting algorithms.',
  resourcesShared: [],
  notesRagged: true,
  notesInline: null,
  notesOutline: '## Bubble sort\n## Insertion sort',
  notesCharacterCount: 15_000,
  ragRetrievalAvailable: true,
}

describe('buildLectureChatSystemPrompt', () => {
  it('includes summary and inline notes when notes are not ragged', () => {
    const prompt = buildLectureChatSystemPrompt(inlineMaterials, 'English', [
      'quiz',
    ])

    expect(prompt).toContain('## Lecture')
    expect(prompt).toContain('Title: React Hooks Deep Dive')
    expect(prompt).toContain('## Resources shared')
    expect(prompt).toContain('https://example.com/hooks-cheatsheet')
    expect(prompt).toContain('## Lecture content (summary)')
    expect(prompt).toContain('The lecture covered React hooks.')
    expect(prompt).toContain('## Instructor notes')
    expect(prompt).toContain('useState stores component state.')
    expect(prompt).not.toContain(AI_TUTOR_LECTURE_RAG_TOOL_NAME)
    expect(prompt).not.toContain(AI_TUTOR_LECTURE_CHAT_RAG_GUIDANCE)
  })

  it('shows the empty resources message when none were shared', () => {
    const prompt = buildLectureChatSystemPrompt(raggedMaterials, 'English', [
      'quiz',
    ])

    expect(prompt).toContain('No resources were shared during the lecture.')
  })

  it('includes notesToc and tool guidance when notes are ragged', () => {
    const prompt = buildLectureChatSystemPrompt(raggedMaterials, 'English', [
      'quiz',
    ])

    expect(prompt).toContain('Table of contents')
    expect(prompt).toContain('## Bubble sort')
    expect(prompt).toContain(AI_TUTOR_LECTURE_RAG_TOOL_NAME)
    expect(prompt).toContain(AI_TUTOR_LECTURE_CHAT_RAG_GUIDANCE)
  })

  it('omits tool guidance when retrieval is unavailable even for ragged notes', () => {
    const prompt = buildLectureChatSystemPrompt(
      { ...raggedMaterials, ragRetrievalAvailable: false },
      AI_TUTOR_DEFAULT_CHAT_LANGUAGE,
      ['quiz'],
    )

    expect(prompt).not.toContain(AI_TUTOR_LECTURE_RAG_TOOL_NAME)
    expect(prompt).toContain(AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE)
    expect(prompt).toContain(AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE)
    expect(prompt).toContain(buildEnforcedChatLanguageInstruction('English'))
  })

  it('includes the practice-questions tool guidance when quiz is supported', () => {
    const prompt = buildLectureChatSystemPrompt(inlineMaterials, 'English', [
      'quiz',
    ])

    expect(prompt).toContain(AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME)
    expect(prompt).not.toContain(
      AI_TUTOR_PRACTICE_QUESTIONS_PLAIN_TEXT_GUIDANCE,
    )
  })

  it('falls back to plain-text practice-questions guidance when quiz is not supported', () => {
    const prompt = buildLectureChatSystemPrompt(inlineMaterials, 'English', [])

    expect(prompt).not.toContain(AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME)
    expect(prompt).toContain(AI_TUTOR_PRACTICE_QUESTIONS_PLAIN_TEXT_GUIDANCE)
  })

  it('enforces the provided language in the system prompt', () => {
    const prompt = buildLectureChatSystemPrompt(inlineMaterials, 'Hindi', [
      'quiz',
    ])

    expect(prompt).toContain(buildEnforcedChatLanguageInstruction('Hindi'))
    expect(prompt).not.toContain('Start by asking which language they prefer')
  })
})

describe('buildLectureChatMessages', () => {
  it('returns only the current question when history is empty', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [],
        question: 'What is useState?',
      }),
    ).toEqual([{ role: 'user', content: 'What is useState?' }])
  })

  it('maps prior turns to user and assistant messages before the question', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: 'Hi', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })

  it('skips empty history entries', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: '', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })
})
