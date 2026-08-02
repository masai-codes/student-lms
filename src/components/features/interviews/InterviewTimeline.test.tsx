// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { InterviewTimeline } from './InterviewTimeline'

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView.
  Element.prototype.scrollIntoView = () => {}
})

afterEach(cleanup)

const answeredTurns = [
  {
    index: 0,
    question: 'Q1?',
    transcript: 'A1',
    answerAudioBase64: null,
    answerSource: 'typed' as const,
    askedAt: '',
    answeredAt: '2024-01-01T00:00:00.000Z',
  },
  {
    index: 1,
    question: 'Q2?',
    transcript: 'A2',
    answerAudioBase64: null,
    answerSource: 'typed' as const,
    askedAt: '',
    answeredAt: '2024-01-01T00:00:00.000Z',
  },
]

describe('InterviewTimeline', () => {
  it('renders past turns and the current question in chronological order', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
        answeredTurns={answeredTurns}
      />,
    )

    const texts = screen
      .getAllByText(/^(Q\d\?|A\d)$/)
      .map((el) => el.textContent)
    expect(texts).toEqual(['Q1?', 'A1', 'Q2?', 'A2', 'Q3?'])
  })

  it('dims past turns but keeps the current question at full opacity', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
        answeredTurns={answeredTurns}
      />,
    )

    const pastQuestion = screen.getByText('Q1?')
    expect(pastQuestion.closest('.opacity-45')).not.toBeNull()
    // Hovering either half of a past pair should reveal both together.
    expect(pastQuestion.closest('.opacity-45')?.className).toContain(
      'hover:opacity-100',
    )

    const currentQuestion = screen.getByTestId('interview-question')
    expect(currentQuestion.textContent).toContain('Q3?')
    expect(currentQuestion.closest('.opacity-45')).toBeNull()
  })

  it('labels each question bubble with its own question number', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
        answeredTurns={answeredTurns}
      />,
    )
    expect(screen.getByText('Question 1')).toBeTruthy()
    expect(screen.getByText('Question 2')).toBeTruthy()
    expect(screen.getByText('Question 3')).toBeTruthy()
  })

  it('shows the question progress header', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
        answeredTurns={answeredTurns}
      />,
    )
    expect(screen.getByText('DSA · Question 3 of 5')).toBeTruthy()
  })

  it('plays back the recorded answer audio for voice-answered turns instead of showing a transcript', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={2}
        totalQuestions={5}
        question="Q2?"
        answeredTurns={[
          {
            index: 0,
            question: 'Q1?',
            transcript: '',
            answerAudioBase64: 'QUJD',
            answerSource: 'voice' as const,
            askedAt: '',
            answeredAt: '2024-01-01T00:00:00.000Z',
          },
        ]}
      />,
    )

    const audio = document.querySelector('audio')
    expect(audio).not.toBeNull()
    expect(audio?.getAttribute('src')).toBe('data:audio/wav;base64,QUJD')
  })
})
