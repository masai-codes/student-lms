import { describe, expect, it } from 'vitest'
import {
  MOVE_TO_NEXT_QUESTION_TOOL,
  buildAskQuestionMessages,
  buildAskQuestionSystemPrompt,
  buildClosingRemarksMessages,
  buildClosingRemarksSystemPrompt,
  buildOpeningTurnMessages,
  buildOpeningTurnSystemPrompt,
  buildTurnMessages,
  buildTurnSystemPrompt,
} from '../buildInterviewPrompt'

describe('MOVE_TO_NEXT_QUESTION_TOOL', () => {
  it('is a no-argument function tool named move_to_next_question', () => {
    expect(MOVE_TO_NEXT_QUESTION_TOOL.type).toBe('function')
    expect(MOVE_TO_NEXT_QUESTION_TOOL.function.name).toBe(
      'move_to_next_question',
    )
  })
})

describe('buildTurnSystemPrompt', () => {
  it('mentions the tool and the current follow-up count', () => {
    const prompt = buildTurnSystemPrompt({
      topicLabel: 'System Design',
      domain: 'software-development',
      rubricFocus: ['Trade-offs'],
      questionNumber: 2,
      totalQuestions: 5,
      followUpCount: 1,
      maxFollowUps: 4,
      language: 'English',
    })
    expect(prompt).toContain('move_to_next_question')
    expect(prompt).toContain('question 2 of 5')
    expect(prompt).toContain('1 of at most 4 follow-ups')
  })
})

describe('buildTurnMessages', () => {
  it('replays prior exchanges as plain assistant/user text pairs', () => {
    const messages = buildTurnMessages({
      systemPrompt: 'sys',
      priorExchanges: [{ prompt: 'Q1?', transcript: 'A1' }],
      currentPrompt: 'Q2?',
      answerText: 'A2',
    })

    expect(messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'assistant', content: 'Q1?' },
      { role: 'user', content: 'A1' },
      { role: 'assistant', content: 'Q2?' },
      { role: 'user', content: 'A2' },
    ])
  })
})

describe('buildOpeningTurnSystemPrompt', () => {
  it('includes topic, domain, rubric focus, and the exact fixed first question', () => {
    const prompt = buildOpeningTurnSystemPrompt({
      topicLabel: 'DSA',
      domain: 'software-development',
      rubricFocus: ['Complexity'],
      totalQuestions: 5,
      firstQuestion: 'What is a hash map?',
      language: 'English',
    })
    expect(prompt).toContain('DSA')
    expect(prompt).toContain('software-development')
    expect(prompt).toContain('Complexity')
    expect(prompt).toContain('greeting')
    expect(prompt).toContain('What is a hash map?')
  })
})

describe('buildOpeningTurnMessages', () => {
  it('sends the system prompt plus a minimal kickoff user message', () => {
    const messages = buildOpeningTurnMessages('sys')
    expect(messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'Begin the interview.' },
    ])
  })
})

describe('buildAskQuestionSystemPrompt / buildAskQuestionMessages', () => {
  it('asks the exact given question, without a greeting', () => {
    const prompt = buildAskQuestionSystemPrompt({
      questionText: 'How would you shard this database?',
      language: 'English',
    })
    expect(prompt).toContain('How would you shard this database?')
    expect(prompt).not.toContain('greeting')
  })

  it('sends the system prompt plus a minimal trigger message', () => {
    const messages = buildAskQuestionMessages('sys')
    expect(messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'Ask the question.' },
    ])
  })
})

describe('buildClosingRemarksSystemPrompt / buildClosingRemarksMessages', () => {
  it('instructs the model not to reveal score or performance', () => {
    const prompt = buildClosingRemarksSystemPrompt('English')
    expect(prompt).toContain('Do not mention or guess at their score')
    expect(prompt).toContain('complete')
  })

  it('sends the system prompt plus a minimal trigger message', () => {
    const messages = buildClosingRemarksMessages('sys')
    expect(messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'Wrap up the interview.' },
    ])
  })
})
