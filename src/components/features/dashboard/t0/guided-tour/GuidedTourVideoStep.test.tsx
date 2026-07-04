// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuidedTourVideoStep } from './GuidedTourVideoStep'

const hoisted = vi.hoisted(() => ({ record: vi.fn() }))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({ recordT0FlowStepComplete: hoisted.record }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.record.mockResolvedValue(undefined)
})

function renderStep(onReported = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <GuidedTourVideoStep lectureId={1} videoUrl="https://x/v.mp4" batchId={5} tab="lms" onReported={onReported} />
    </QueryClientProvider>,
  )
  return { onReported }
}

function fireTimeUpdate(seconds: number) {
  const videos = document.querySelectorAll('video')
  if (videos.length === 0) throw new Error('no video element')
  videos.forEach((video) => {
    Object.defineProperty(video, 'currentTime', { value: seconds, configurable: true })
    fireEvent.timeUpdate(video)
  })
}

describe('GuidedTourVideoStep', () => {
  it('shows a placeholder when there is no video url', () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <GuidedTourVideoStep lectureId={1} videoUrl={null} batchId={5} tab="lms" onReported={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('guided-tour-video-missing')).toBeTruthy()
  })

  it('reports completion once watch time crosses the threshold, and only once', async () => {
    const { onReported } = renderStep()

    fireTimeUpdate(5) // below threshold — no report
    expect(hoisted.record).not.toHaveBeenCalled()

    fireTimeUpdate(12) // crosses 10s — reports
    await waitFor(() => expect(hoisted.record).toHaveBeenCalledTimes(1))
    expect(hoisted.record).toHaveBeenCalledWith(1, 5, 'lms', 12)
    await waitFor(() => expect(onReported).toHaveBeenCalled())

    fireTimeUpdate(15) // already reported — no second call
    expect(hoisted.record).toHaveBeenCalledTimes(1)
  })
})
