import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import { resolveLectureRecordingForSupport } from '../resolveLectureRecordingForSupport'

import { verifyUrlReachable } from '@/server/learn/utils/verifyUrlReachable'

vi.mock('@/server/learn/utils/verifyUrlReachable', () => ({
  verifyUrlReachable: vi.fn(),
}))

const gumletLinks = {
  gumlet: { hls_url: 'https://cdn.example/hls/master.m3u8' },
}

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'
const adaptiveLink =
  'https://experience-api.masaischool.com/api/adaptive-lecture/abc123/join'

const supportProbeOptions = { timeoutMs: 1500 }

describe('resolveLectureRecordingForSupport', () => {
  beforeEach(() => {
    vi.mocked(verifyUrlReachable).mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns not_available for live lectures still in session without probing', async () => {
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

    expect(result.recordingStatus).toBe('not_available')
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

  it('returns not_available when gumlet url fails HEAD check', async () => {
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

    expect(result).toEqual({
      recordingStatus: 'not_available',
      recordingUrl: 'https://cdn.example/hls/master.m3u8',
      recordingVerified: false,
    })
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

  it('returns not_available for SAL lectures still in the live window', async () => {
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

    expect(result.recordingStatus).toBe('not_available')
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

  it('returns available when gumlet is missing but videos has HLS', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(true)

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: null,
      videos: [
        'https://cdn.masaischool.com/hls-videos/157896/6a6090c8d1790fa22d8c9e1e/master.m3u8',
      ],
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result).toEqual({
      recordingStatus: 'available',
      recordingUrl:
        'https://cdn.masaischool.com/hls-videos/157896/6a6090c8d1790fa22d8c9e1e/master.m3u8',
      recordingVerified: true,
    })
  })

  it('returns not_available when videos HLS fails HEAD check', async () => {
    vi.mocked(verifyUrlReachable).mockResolvedValue(false)

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: null,
      videos: ['https://cdn.example.com/master.m3u8'],
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result.recordingStatus).toBe('not_available')
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
    expect(verifyUrlReachable).toHaveBeenCalledWith(
      'https://example.com/recording.mp4',
      supportProbeOptions,
    )
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

  it('rewrites non-mp4 S3 zoom segment through CloudFront before HEAD check', async () => {
    vi.stubEnv('CLOUD_FRONT_BASE', 'dxyz.cloudfront.net')
    vi.mocked(verifyUrlReachable).mockResolvedValue(true)

    const raw =
      'https://zoom-lecture-recordings.s3.ap-south-1.amazonaws.com/84313531944/link_02_1750917137000'

    const result = await resolveLectureRecordingForSupport({
      zoomLink: null,
      schedule,
      concludes,
      nowMs: Date.now(),
      vimeoDownloadLinks: null,
      videos: [raw],
      hideVideo: false,
      lectureKind: 'live',
      livePhase: 'after',
      videoPhase: null,
    })

    expect(result).toEqual({
      recordingStatus: 'available',
      recordingUrl:
        'https://dxyz.cloudfront.net/zoom/84313531944/link_02_1750917137000',
      recordingVerified: true,
    })
    expect(verifyUrlReachable).toHaveBeenCalledWith(
      'https://dxyz.cloudfront.net/zoom/84313531944/link_02_1750917137000',
      supportProbeOptions,
    )
  })

  it('prefers gumlet over videos when both exist', async () => {
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
    expect(verifyUrlReachable).toHaveBeenCalledWith(
      'https://cdn.example/hls/master.m3u8',
      supportProbeOptions,
    )
  })
})
