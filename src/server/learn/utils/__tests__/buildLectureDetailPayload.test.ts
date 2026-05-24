import { describe, expect, it } from 'vitest'

import { buildLectureDetailPayload } from '../buildLectureDetailPayload'
import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'

const core: LearnHubDetailPayload = {
  id: 227,
  title: 'DSA Intro',
  hostName: 'Ravi',
  displayDate: '20 May, 10:00 AM',
  priority: 'mandatory',
  tags: ['live', 'coding', 'Week 1'],
  discussions: [],
}

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

const emptyTabs: LectureDetailTabContent = {
  description: null,
  notes: null,
  aiSummary: null,
  transcript: null,
  associated: null,
}

describe('buildLectureDetailPayload', () => {
  it('builds live lecture payload with recording after end', () => {
    const concludesMs = new Date(concludes).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'live',
        schedule,
        concludes,
        zoomLink: 'https://zoom.example/j/1',
        videos: null,
        vimeoDownloadLinks: { gumlet: { hls_url: 'https://cdn.example/hls.m3u8' } },
        vimeoPlayerEmbedUrl: null,
        settings: null,
        hostAvatarUrl: null,
        notes: '  Lecture notes  ',
      },
      concludesMs + 60_000,
      { ...emptyTabs, notes: 'Lecture notes' },
      null,
    )

    expect(payload.lectureKind).toBe('live')
    expect(payload.notes).toBe('Lecture notes')
    expect(payload.tabs.notes).toBe('Lecture notes')
    expect(payload.hideNotes).toBe(false)
    expect(payload.livePhase).toBe('after')
    expect(payload.hasRecording).toBe(true)
    expect(payload.videoUrl).toBe('https://cdn.example/hls.m3u8')
    expect(payload.zoomLink).toBe('https://zoom.example/j/1')
    expect(payload.joinLiveButtonState).toBe('hidden')
    expect(payload.videoAttendance).toBeNull()
  })

  it('strips video when hide_video is enabled', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'video',
        schedule,
        concludes,
        zoomLink: null,
        videos: ['https://example.com/a.mp4'],
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
        settings: { hide_video: true, hide_notes: 1 },
        hostAvatarUrl: '/avatar.png',
        notes: null,
      },
      scheduleMs,
      emptyTabs,
      null,
    )

    expect(payload.lectureKind).toBe('video')
    expect(payload.hideVideo).toBe(true)
    expect(payload.hideNotes).toBe(true)
    expect(payload.notes).toBeNull()
    expect(payload.videoUrl).toBeNull()
    expect(payload.hasRecording).toBe(false)
    expect(payload.hostAvatarUrl).toBe('/avatar.png')
  })

  it('throws for unsupported lecture types', () => {
    expect(() =>
      buildLectureDetailPayload(
        core,
        {
          type: 'scrum',
          schedule,
          concludes,
          zoomLink: null,
          videos: null,
          vimeoDownloadLinks: null,
          vimeoPlayerEmbedUrl: null,
          settings: null,
          hostAvatarUrl: null,
          notes: null,
        },
        Date.now(),
        emptyTabs,
        null,
      ),
    ).toThrow('LECTURE_DETAIL_UNSUPPORTED_TYPE')
  })
})
