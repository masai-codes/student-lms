// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInterviewSession } from '../useInterviewSession'
import { streamSubmitInterviewTurn } from '@/lib/api/interviews/streamSubmitInterviewTurn'
import { fetchInterviewSession } from '@/lib/api/interviews/interviewsApi'

vi.mock('@/lib/api/interviews/streamSubmitInterviewTurn', () => ({
  streamSubmitInterviewTurn: vi.fn(),
}))

vi.mock('@/lib/api/interviews/interviewsApi', () => ({
  fetchInterviewSession: vi.fn(async () => ({
    turns: [],
    status: 'in_progress',
  })),
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchInterviewSession).mockResolvedValue({
    turns: [],
    status: 'in_progress',
  } as any)
})

describe('useInterviewSession', () => {
  it('accumulates streamingQuestion from onQuestionDelta and clears it on done', async () => {
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        handlers.onQuestionDelta('How do ')
        handlers.onQuestionDelta('you handle it?')
        handlers.onDone({
          status: 'in_progress',
          transcript: 'a',
          nextQuestion: 'How do you handle it?',
        })
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    let submitPromise!: Promise<void>
    act(() => {
      submitPromise = result.current.submitAnswer({
        kind: 'typed',
        text: 'answer',
      })
    })

    await act(async () => {
      await submitPromise
    })

    expect(result.current.streamingQuestion).toBe('')
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets a friendly error message and clears streamingQuestion on error', async () => {
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        handlers.onQuestionDelta('partial')
        handlers.onError('INTERVIEW_TRANSCRIPT_EMPTY')
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    await act(async () => {
      await result.current.submitAnswer({ kind: 'typed', text: 'answer' })
    })

    expect(result.current.streamingQuestion).toBe('')
    expect(result.current.error).toBe(
      "We couldn't make out your answer — please re-record and try again.",
    )
  })

  it('falls back to a generic message for an unrecognized error code', async () => {
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        handlers.onError('SOMETHING_WEIRD')
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    await act(async () => {
      await result.current.submitAnswer({ kind: 'typed', text: 'answer' })
    })

    expect(result.current.error).toBe('Something went wrong. Please try again.')
  })

  it('shows the live streamingQuestion text while the turn is in flight', async () => {
    let capturedOnDelta!: (text: string) => void
    let resolveDone!: () => void
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        capturedOnDelta = handlers.onQuestionDelta
        resolveDone = () =>
          handlers.onDone({
            status: 'in_progress',
            transcript: 'a',
            nextQuestion: 'Q',
          })
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    let submitPromise!: Promise<void>
    act(() => {
      submitPromise = result.current.submitAnswer({
        kind: 'typed',
        text: 'answer',
      })
    })

    act(() => capturedOnDelta('Tell me a'))
    await waitFor(() =>
      expect(result.current.streamingQuestion).toBe('Tell me a'),
    )
    act(() => capturedOnDelta('bout X'))
    await waitFor(() =>
      expect(result.current.streamingQuestion).toBe('Tell me about X'),
    )

    act(() => resolveDone())
    await act(async () => {
      await submitPromise
    })
    expect(result.current.streamingQuestion).toBe('')
  })
})
