import { describe, expect, it } from 'vitest'
import {
  buildInterviewMessages,
  buildInterviewSystemPrompt,
  buildOpeningTurnMessages,
  buildOpeningTurnSystemPrompt,
} from '../buildInterviewPrompt'

describe('buildInterviewSystemPrompt', () => {
  it('instructs the model to ask the exact next question when not the last question', () => {
    const prompt = buildInterviewSystemPrompt({
      topicLabel: 'System Design',
      domain: 'software-development',
      rubricFocus: ['Trade-offs'],
      questionNumber: 2,
      totalQuestions: 5,
      followUpCount: 0,
      maxFollowUps: 4,
      forced: false,
      nextQuestionText: 'How would you shard this database?',
      language: 'English',
    })
    expect(prompt).toContain('How would you shard this database?')
    expect(prompt).not.toContain('FINAL question')
  })

  it('instructs the model to end the interview on the last question', () => {
    const prompt = buildInterviewSystemPrompt({
      topicLabel: 'System Design',
      domain: 'software-development',
      rubricFocus: ['Trade-offs'],
      questionNumber: 5,
      totalQuestions: 5,
      followUpCount: 4,
      maxFollowUps: 4,
      forced: true,
      nextQuestionText: null,
      language: 'English',
    })
    expect(prompt).toContain('FINAL question')
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

describe('buildInterviewMessages', () => {
  const typedPriorExchanges = [
    {
      prompt: 'Q1?',
      transcript: 'A1',
      answerAudioBase64: null,
    },
  ]

  it('projects a typed prior exchange as an assistant/user text pair', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorExchanges: typedPriorExchanges,
      currentPrompt: 'Q2?',
      answer: { kind: 'typed', text: 'A2' },
    })

    expect(messages[0]).toEqual({ role: 'system', content: 'sys' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Q1?' })
    expect(messages[2]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'A1' }],
    })
    expect(messages[3]).toEqual({ role: 'assistant', content: 'Q2?' })
  })

  it('replays a voice prior exchange as raw audio, not text', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorExchanges: [
        {
          prompt: 'Q1?',
          transcript: '',
          answerAudioBase64: 'PRIORAUDIO',
        },
      ],
      currentPrompt: 'Q2?',
      answer: { kind: 'typed', text: 'A2' },
    })

    expect(messages[2]).toEqual({
      role: 'user',
      content: [
        {
          type: 'input_audio',
          input_audio: { data: 'PRIORAUDIO', format: 'wav' },
        },
      ],
    })
  })

  it('sends a text-only content part for typed answers', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorExchanges: [],
      currentPrompt: 'Q1?',
      answer: { kind: 'typed', text: 'typed answer' },
    })
    const last = messages.at(-1)
    expect(last).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'typed answer' }],
    })
  })

  it('sends an input_audio content part for voice answers', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorExchanges: [],
      currentPrompt: 'Q1?',
      answer: { kind: 'audio', base64: 'BASE64DATA', format: 'wav' },
    })
    const last = messages.at(-1)
    expect(last).toEqual({
      role: 'user',
      content: [
        {
          type: 'input_audio',
          input_audio: { data: 'BASE64DATA', format: 'wav' },
        },
      ],
    })
  })
})
