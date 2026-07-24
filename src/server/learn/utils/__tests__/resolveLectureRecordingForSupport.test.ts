import { describe, expect, it, vi, beforeEach } from 'vitest'

import { resolveLectureRecordingForSupport } from '../resolveLectureRecordingForSupport'

vi.mock('@/server/learn/utils/verifyUrlReachable', () => ({
  verifyUrlReachable: vi.fn(),
}))

import { verifyUrlReachable } from '@/server/learn/utils/verifyUrlReachable'

const gumletLinks = {
  gumlet: { hls_url: 'https://cdn.example/hls/master.m3u8' },
}

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'
const adaptiveLink =
  'https://experience-api.masaischool.com/api/adaptive-lecture/abc123/join'

describe('resolveLectureRecordingForSupport', () => {
  beforeEach(() => {
    vi.mocked(verifyUrlReachable).mockReset()
  })

  it('returns pending for live lectures still in session', async () => {
    const scheduleMs = new Date(schedule).getTime()
    const result = await resolveLectureRecordingForSupport({
      zoomLink: 'https://zoom.example/j/1',
      schedule,
      concludes,
      nowMs: scheduleMs + 5 * 60 * 1000,
      vimeoDownloadLinks: gumletLinks,
      videos: null,
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
    const concludesMs = new Date(concludes).getTime()

    const result = await resolveLectureRecordingForSupport({
      zoomLink: 'https://zoom.example/j/1',
      schedule,
      concludes,
      nowMs: concludesMs + 31 * 60 * 1000,
      vimeoDownloadLinks: gumletLinks,
      videos: null,
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
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: gumletLinks,
      videos: null,
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
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: gumletLinks,
      videos: null,
      hideVideo: true,
      lectureKind: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    expect(result.recordingStatus).toBe('not_available')
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })

  it('returns available for SAL lectures past concludes + 30 min without gumlet', async () => {
    const concludesMs = new Date(concludes).getTime()
    const result = await resolveLectureRecordingForSupport({
      zoomLink: adaptiveLink,
      schedule,
      concludes,
      nowMs: concludesMs + 31 * 60 * 1000,
      vimeoDownloadLinks: null,
      videos: null,
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result).toEqual({
      recordingStatus: 'available',
      recordingUrl: null,
      recordingVerified: true,
    })
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })

  it('returns pending for SAL lectures still in the live window', async () => {
    const scheduleMs = new Date(schedule).getTime()
    const result = await resolveLectureRecordingForSupport({
      zoomLink: adaptiveLink,
      schedule,
      concludes,
      nowMs: scheduleMs + 5 * 60 * 1000,
      vimeoDownloadLinks: null,
      videos: null,
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'during',
      videoPhase: null,
    })

    expect(result.recordingStatus).toBe('pending')
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })

  it('returns not_available for SAL lectures in the post-conclude grace window', async () => {
    const concludesMs = new Date(concludes).getTime()
    const result = await resolveLectureRecordingForSupport({
      zoomLink: adaptiveLink,
      schedule,
      concludes,
      nowMs: concludesMs + 10 * 60 * 1000,
      vimeoDownloadLinks: null,
      videos: null,
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'during',
      videoPhase: null,
    })

    expect(result.recordingStatus).toBe('not_available')
    expect(verifyUrlReachable).not.toHaveBeenCalled()
  })

  it('returns available when gumlet is missing but videos mp4 passes HEAD check', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(true)

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: null,
      videos: ['https://example.com/recording.mp4'],
      hideVideo: false,
      lectureKind: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    expect(result).toEqual({
      recordingStatus: 'available',
      recordingUrl: 'https://example.com/recording.mp4',
      recordingVerified: true,
    })
    expect(verifyUrlReachable).toHaveBeenCalledWith('https://example.com/recording.mp4')
  })

  it('returns not_available when gumlet is missing and videos mp4 fails HEAD check', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(false)

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: null,
      videos: ['https://example.com/recording.mp4'],
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result).toEqual({
      recordingStatus: 'not_available',
      recordingUrl: 'https://example.com/recording.mp4',
      recordingVerified: false,
    })
  })

  it('prefers gumlet over videos mp4 when both exist', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(true)

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: gumletLinks,
      videos: ['https://example.com/recording.mp4'],
      hideVideo: false,
      lectureKind: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    expect(result.recordingUrl).toBe('https://cdn.example/hls/master.m3u8')
    expect(verifyUrlReachable).toHaveBeenCalledTimes(1)
    expect(verifyUrlReachable).toHaveBeenCalledWith('https://cdn.example/hls/master.m3u8')
  })
})
