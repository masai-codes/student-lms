import { describe, expect, it, vi, beforeEach } from 'vitest'

import { resolveLectureRecordingForSupport } from '../resolveLectureRecordingForSupport'

vi.mock('@/server/learn/utils/verifyUrlReachable', () => ({
  verifyUrlReachable: vi.fn(),
}))

import { verifyUrlReachable } from '@/server/learn/utils/verifyUrlReachable'

const gumletLinks = {
  gumlet: { hls_url: 'https://cdn.example/hls/master.m3u8' },
}

describe('resolveLectureRecordingForSupport', () => {
  beforeEach(() => {
    vi.mocked(verifyUrlReachable).mockReset()
  })

  it('returns pending for live lectures still in session', async () => {
    const result = await resolveLectureRecordingForSupport({
      vimeoDownloadLinks: gumletLinks,
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'during',
      videoPhase: null,
    })

    expect(result.recordingStatus).toBe('pending')
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })

  it('returns available when gumlet url passes HEAD check', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(true)

    const result = await resolveLectureRecordingForSupport({
      vimeoDownloadLinks: gumletLinks,
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result).toEqual({
      recordingStatus: 'available',
      recordingUrl: 'https://cdn.example/hls/master.m3u8',
      recordingVerified: true,
    })
  })

  it('returns processing when gumlet url fails HEAD check', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(false)

    const result = await resolveLectureRecordingForSupport({
      vimeoDownloadLinks: gumletLinks,
      hideVideo: false,
      lectureKind: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    expect(result.recordingStatus).toBe('processing')
    expect(result.recordingVerified).toBe(false)
  })

  it('returns not_available when hide_video is enabled', async () => {
    const result = await resolveLectureRecordingForSupport({
      vimeoDownloadLinks: gumletLinks,
      hideVideo: true,
      lectureKind: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    expect(result.recordingStatus).toBe('not_available')
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })
})
