// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLectureAiChatFaqs } from '../useLectureAiChatFaqs'
import { getLectureFaqs } from '@/lib/api/ai-tutor/aiTutorChatApi'

vi.mock('@/lib/api/ai-tutor/aiTutorChatApi', () => ({
  getLectureFaqs: vi.fn(),
}))

function Probe({ lectureId }: { lectureId: number }) {
  const { data, isLoading } = useLectureAiChatFaqs(lectureId)
  return (
    <div data-testid="probe">
      {JSON.stringify({ faqs: data?.faqs ?? null, isLoading })}
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

describe('useLectureAiChatFaqs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fetches faqs for the given lecture', async () => {
    vi.mocked(getLectureFaqs).mockResolvedValue({
      faqs: [{ question: 'Q1', answer: 'A1' }],
    })

    renderProbe(42)

    await waitFor(() => {
      expect(probeState()).toMatchObject({
        faqs: [{ question: 'Q1', answer: 'A1' }],
      })
    })
    expect(getLectureFaqs).toHaveBeenCalledWith(42)
  })
})
