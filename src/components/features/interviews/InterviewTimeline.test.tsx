// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InterviewTimeline } from './InterviewTimeline'

afterEach(cleanup)

describe('InterviewTimeline', () => {
  it('shows only the current question, not earlier ones', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
      />,
    )

    expect(screen.getByTestId('interview-question').textContent).toContain(
      'Q3?',
    )
    expect(screen.queryByText('Q1?')).toBeNull()
    expect(screen.queryByText('Q2?')).toBeNull()
  })

  it('shows the question progress header', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
      />,
    )
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'DSA · Question 3 of 5',
      ),
    ).toBeTruthy()
  })

  it('renders a follow-up question as a sub-line below the main question', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={2}
        totalQuestions={5}
        question="Q2?"
        followUpQuestion="Can you say more about that?"
      />,
    )

    expect(screen.getByTestId('interview-follow-up').textContent).toBe(
      'Can you say more about that?',
    )
  })

  it('renders a segmented progress bar with one segment per question', () => {
    render(
      <InterviewTimeline
        topicLabel="DSA"
        questionNumber={3}
        totalQuestions={5}
        question="Q3?"
      />,
    )

    expect(screen.getByTestId('interview-progress-bar').children).toHaveLength(
      5,
    )
  })
})
