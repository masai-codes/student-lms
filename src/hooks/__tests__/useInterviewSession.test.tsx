// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInterviewSession } from '../useInterviewSession'
import { streamSubmitInterviewTurn } from '@/lib/api/interviews/streamSubmitInterviewTurn'
import { fetchInterviewSession } from '@/lib/api/interviews/interviewsApi'

const hoisted = vi.hoisted(() => ({
  pushChunk: vi.fn(),
  finish: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('@/lib/api/interviews/streamSubmitInterviewTurn', () => ({
  streamSubmitInterviewTurn: vi.fn(),
}))

vi.mock('@/lib/api/interviews/interviewsApi', () => ({
  fetchInterviewSession: vi.fn(async () => ({
    turns: [],
    status: 'in_progress',
  })),
}))

vi.mock('@/lib/audio/interviewAudioPlayer', () => ({
  createInterviewAudioPlayer: () => ({
    pushChunk: hoisted.pushChunk,
    finish: hoisted.finish,
    cancel: hoisted.cancel,
  }),
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
  it('plays streamed audio deltas and finishes the player on done', async () => {
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        handlers.onAudioDelta('QUJD')
        handlers.onAudioDelta('REVG')
        handlers.onDone({
          status: 'in_progress',
          nextQuestion: 'How do you handle it?',
        })
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    await act(async () => {
      await result.current.submitAnswer({ kind: 'typed', text: 'answer' })
    })

    expect(hoisted.pushChunk).toHaveBeenNthCalledWith(1, 'QUJD')
    expect(hoisted.pushChunk).toHaveBeenNthCalledWith(2, 'REVG')
    expect(hoisted.finish).toHaveBeenCalledTimes(1)
    expect(hoisted.cancel).not.toHaveBeenCalled()
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('cancels the player and sets a friendly error message on error', async () => {
    vi.mocked(streamSubmitInterviewTurn).mockImplementation(
      (_sessionId, _answer, handlers) => {
        handlers.onAudioDelta('QUJD')
        handlers.onError('INTERVIEW_RESPONSE_EMPTY')
        return () => {}
      },
    )

    const { result } = renderHook(() => useInterviewSession(1), { wrapper })

    await act(async () => {
      await result.current.submitAnswer({ kind: 'typed', text: 'answer' })
    })

    expect(hoisted.cancel).toHaveBeenCalledTimes(1)
    expect(hoisted.finish).not.toHaveBeenCalled()
    expect(result.current.error).toBe(
      "The interviewer didn't respond — please try again.",
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
})
