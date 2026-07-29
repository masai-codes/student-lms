// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LectureTranscriptSource } from '@/server/learn/lectureDetailTypes'
import { LectureTranscriptTabContent } from '../LectureTranscriptTabContent'
import { fetchLectureTranscriptFromCache } from '@/lib/api/cache/lectureTranscriptApi'

vi.mock('@/lib/api/cache/lectureTranscriptApi', () => ({
  fetchLectureTranscriptFromCache: vi.fn(),
}))

const AVAILABLE: LectureTranscriptSource = {
  available: true,
  url: '/api/cache/transcript/12/34/7',
}

const EMPTY_COPY = {
  emptyTitle: 'Transcript not available',
  emptyDescription: 'The transcript will appear here once processed.',
}

function renderTab(transcript: LectureTranscriptSource = AVAILABLE) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LectureTranscriptTabContent transcript={transcript} {...EMPTY_COPY} />
    </QueryClientProvider>,
  )
}

describe('LectureTranscriptTabContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fetches the transcript on open and renders timestamped segments', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockResolvedValue({
      lectureId: 7,
      segments: [
        { id: 1, start: 0, end: 4, text: 'Hello there' },
        { id: 2, start: 65, end: 70, text: 'Welcome to class' },
      ],
      text: null,
    })

    renderTab()

    expect(screen.getByTestId('lecture-transcript-skeleton')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByTestId('lecture-transcript-list')).toBeTruthy()
    })
    expect(screen.getAllByTestId('lecture-transcript-segment')).toHaveLength(2)
    expect(screen.getByText('Welcome to class')).toBeTruthy()
    expect(
      screen.getByTestId('lecture-transcript-download-button'),
    ).toBeTruthy()
    expect(fetchLectureTranscriptFromCache).toHaveBeenCalledWith(
      '/api/cache/transcript/12/34/7',
    )
  })

  it('renders the plain-text fallback when no segments exist', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockResolvedValue({
      lectureId: 7,
      segments: [],
      text: 'A flat transcript',
    })

    renderTab()

    await waitFor(() => {
      expect(screen.getByText('A flat transcript')).toBeTruthy()
    })
    expect(screen.queryByTestId('lecture-transcript-list')).toBeNull()
    expect(
      screen.getByTestId('lecture-transcript-download-button'),
    ).toBeTruthy()
  })

  it('never fetches when the lecture has no transcript', () => {
    renderTab({ available: false, url: null })

    expect(screen.getByText('Transcript not available')).toBeTruthy()
    expect(fetchLectureTranscriptFromCache).not.toHaveBeenCalled()
    expect(
      screen.queryByTestId('lecture-transcript-download-button'),
    ).toBeNull()
  })

  it('shows the empty state when the fetch resolves with nothing', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockResolvedValue({
      lectureId: 0,
      segments: [],
      text: null,
    })

    renderTab()

    await waitFor(() => {
      expect(screen.getByText('Transcript not available')).toBeTruthy()
    })
  })

  it('surfaces a retryable error when the fetch fails', async () => {
    vi.mocked(fetchLectureTranscriptFromCache).mockRejectedValue(
      new Error('network down'),
    )

    renderTab()

    // The hook retries once before giving up, so allow for the backoff delay.
    await waitFor(
      () => {
        expect(screen.getByText("Couldn't load the transcript")).toBeTruthy()
      },
      { timeout: 5000 },
    )
  })
})
