// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLectureAiChatSuggestions } from '../useLectureAiChatSuggestions'
import { getLectureAiChatSuggestions } from '@/lib/api/cache/lectureAiChatSuggestionsApi'

vi.mock('@/lib/api/cache/lectureAiChatSuggestionsApi', () => ({
  getLectureAiChatSuggestions: vi.fn(),
}))

function Probe({ lectureId }: { lectureId: number }) {
  const { data, isLoading } = useLectureAiChatSuggestions(lectureId)
  return (
    <div data-testid="probe">
      {JSON.stringify({ suggestions: data?.suggestions ?? null, isLoading })}
    </div>
  )
}

function renderProbe(lectureId: number) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Probe lectureId={lectureId} />
    </QueryClientProvider>,
  )
}

function probeState() {
  return JSON.parse(screen.getByTestId('probe').textContent ?? '{}')
}

describe('useLectureAiChatSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fetches suggestions for the given lecture', async () => {
    vi.mocked(getLectureAiChatSuggestions).mockResolvedValue({
      suggestions: [{ icon: 'faq', question: 'Q1' }],
    })

    renderProbe(42)

    await waitFor(() => {
      expect(probeState()).toMatchObject({
        suggestions: [{ icon: 'faq', question: 'Q1' }],
      })
    })
    expect(getLectureAiChatSuggestions).toHaveBeenCalledWith(42)
  })
})
