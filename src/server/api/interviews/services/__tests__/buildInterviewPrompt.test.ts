import { describe, expect, it } from 'vitest'
import {
  buildFirstQuestionPrompt,
  buildInterviewMessages,
  buildInterviewSystemPrompt,
} from '../buildInterviewPrompt'

describe('buildInterviewSystemPrompt', () => {
  it('instructs the model to ask a follow-up when not the last question', () => {
    const prompt = buildInterviewSystemPrompt({
      topicLabel: 'System Design',
      domain: 'software-development',
      rubricFocus: ['Trade-offs'],
      questionNumber: 2,
      totalQuestions: 5,
    })
    expect(prompt).toContain('question 3 of 5')
    expect(prompt).not.toContain('FINAL question')
  })

  it('instructs the model to end the interview on the last question', () => {
    const prompt = buildInterviewSystemPrompt({
      topicLabel: 'System Design',
      domain: 'software-development',
      rubricFocus: ['Trade-offs'],
      questionNumber: 5,
      totalQuestions: 5,
    })
    expect(prompt).toContain('FINAL question')
  })
})

describe('buildFirstQuestionPrompt', () => {
  it('includes topic, domain, and rubric focus', () => {
    const prompt = buildFirstQuestionPrompt({
      topicLabel: 'DSA',
      domain: 'software-development',
      rubricFocus: ['Complexity'],
      totalQuestions: 5,
    })
    expect(prompt).toContain('DSA')
    expect(prompt).toContain('software-development')
    expect(prompt).toContain('Complexity')
  })
})

describe('buildInterviewMessages', () => {
  const priorTurns = [
    {
      index: 0,
      question: 'Q1?',
      transcript: 'A1',
      answerSource: 'voice' as const,
      askedAt: '',
      answeredAt: '',
    },
  ]

  it('projects prior turns as assistant/user text pairs', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorTurns,
      currentQuestion: 'Q2?',
      answer: { kind: 'typed', text: 'A2' },
    })

    expect(messages[0]).toEqual({ role: 'system', content: 'sys' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Q1?' })
    expect(messages[2]).toEqual({ role: 'user', content: 'A1' })
    expect(messages[3]).toEqual({ role: 'assistant', content: 'Q2?' })
  })

  it('sends a text-only content part for typed answers', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorTurns: [],
      currentQuestion: 'Q1?',
      answer: { kind: 'typed', text: 'typed answer' },
    })
    const last = messages.at(-1)
    expect(last).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'typed answer' }],
    })
  })

  it('sends a text + input_audio content part for voice answers', () => {
    const messages = buildInterviewMessages({
      systemPrompt: 'sys',
      priorTurns: [],
      currentQuestion: 'Q1?',
      answer: { kind: 'audio', base64: 'BASE64DATA', format: 'wav' },
    })
    const last = messages.at(-1) as { content: Array<Record<string, unknown>> }
    expect(last.content[0].type).toBe('text')
    expect(last.content[1]).toEqual({
      type: 'input_audio',
      input_audio: { data: 'BASE64DATA', format: 'wav' },
    })
  })
})
