// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LectureTranscriptSource } from '@/server/learn/lectureDetailTypes'
import { useLectureTranscript } from '../useLectureTranscript'
import { fetchLectureTranscriptFromCache } from '@/lib/api/cache/lectureTranscriptApi'

vi.mock('@/lib/api/cache/lectureTranscriptApi', () => ({
  fetchLectureTranscriptFromCache: vi.fn(),
}))

const AVAILABLE: LectureTranscriptSource = {
  available: true,
  url: '/api/cache/transcript/12/34/7',
}

function Probe({
  source,
  enabled,
}: {
  source: LectureTranscriptSource
  enabled: boolean
}) {
  const state = useLectureTranscript(source, enabled)
  return (
    <div data-testid="probe">
      {JSON.stringify({
        count: state.segments.length,
        text: state.text,
        lectureId: state.lectureId,
        isLoading: state.isLoading,
        isError: state.isError,
        hasContent: state.hasContent,
      })}
    </div>
  )
}

function renderProbe(source: LectureTranscriptSource, enabled: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <Probe source={source} enabled={enabled} />
      {/* Second consumer with the same key — proves the request is shared. */}
      <Probe source={source} enabled={enabled} />
    </QueryClientProvider>,
  )
  return { ...view, queryClient }
}

function probeState() {
  return JSON.parse(screen.getAllByTestId('probe')[0].textContent ?? '{}')
}

describe('useLectureTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('does not fetch until enabled', () => {
    renderProbe(AVAILABLE, false)

    expect(fetchLectureTranscriptFromCache).not.toHaveBeenCalled()
    expect(probeState()).toMatchObject({
      count: 0,
      lectureId: null,
      isLoading: false,
      hasContent: false,
    })
  })

  it('fetches once for two consumers sharing the same transcript', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockResolvedValue({
      lectureId: 7,
      segments: [{ id: 1, start: 0, end: 2, text: 'Hi' }],
      text: null,
    })

    renderProbe(AVAILABLE, true)

    await waitFor(() => {
      expect(probeState()).toMatchObject({
        count: 1,
        lectureId: 7,
        hasContent: true,
      })
    })
    expect(fetchLectureTranscriptFromCache).toHaveBeenCalledTimes(1)
  })

  it('stays idle when the payload reports no transcript', () => {
    renderProbe({ available: false, url: null }, true)

    expect(fetchLectureTranscriptFromCache).not.toHaveBeenCalled()
  })

  it('reports an error state when the fetch rejects', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockRejectedValue(
      new Error('boom'),
    )

    renderProbe(AVAILABLE, true)

    // One retry with backoff happens before the error surfaces.
    await waitFor(
      () => {
        expect(probeState()).toMatchObject({ isError: true, hasContent: false })
      },
      { timeout: 5000 },
    )
  })
})
