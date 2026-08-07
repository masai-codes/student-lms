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
  notes: null,
  aiSummary: null,
  transcript: { available: false, url: null },
  associatedItems: [],
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
        vimeoDownloadLinks: {
          gumlet: { hls_url: 'https://cdn.example/hls.m3u8' },
        },
        vimeoPlayerEmbedUrl: null,
        settings: null,
        hostAvatarUrl: null,
        notes: '  Lecture notes  ',
      },
      // Past the 30-min post-conclude Join Now grace window.
      concludesMs + 31 * 60 * 1000,
      { ...emptyTabs, notes: 'Lecture notes' },
      null,
      null,
      null,
      { mode: 'legacy', rating: null, text: null, tags: [] },
    )

    expect(payload.lectureKind).toBe('live')
    expect(payload.feedback).toEqual({
      mode: 'legacy',
      canSubmit: false,
      rating: null,
      text: null,
      tags: [],
    })
    expect(payload.notes).toBe('Lecture notes')
    expect(payload.tabs.notes).toBe('Lecture notes')
    expect(payload.hideNotes).toBe(false)
    expect(payload.livePhase).toBe('after')
    expect(payload.hasRecording).toBe(true)
    expect(payload.videoUrl).toBe('https://cdn.example/hls.m3u8')
    expect(payload.zoomLink).toBe('https://zoom.example/j/1')
    expect(payload.joinLiveButtonState).toBe('hidden')
    expect(payload.videoAttendance).toBeNull()
    // Non-adaptive Zoom lecture: no SAL "watch recording" link.
    expect(payload.adaptiveRecordingUrl).toBeNull()
  })

  it('exposes the lecture-scoped adaptive link as the recording for an ended SAL lecture', () => {
    const concludesMs = new Date(concludes).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'live',
        schedule,
        concludes,
        zoomLink:
          'https://experience-api.masaischool.com/api/adaptive-lecture/abc123/join',
        // SAL recordings live on the adaptive platform, not in these fields.
        videos: null,
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
        settings: null,
        hostAvatarUrl: null,
        notes: null,
      },
      concludesMs + 31 * 60 * 1000,
      emptyTabs,
      null,
      null,
      null,
      { mode: 'legacy', rating: null, text: null, tags: [] },
    )

    expect(payload.livePhase).toBe('after')
    expect(payload.hasRecording).toBe(false)
    expect(payload.videoUrl).toBeNull()
    // Middle segment rewritten from the meeting id to the lecture id (227).
    expect(payload.adaptiveRecordingUrl).toBe(
      'https://experience-api.masaischool.com/api/adaptive-lecture/227/join',
    )
  })

  it('always allows submission in zef mode, ignoring the window', () => {
    const concludesMs = new Date(concludes).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'live',
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
      // Well past any legacy window (concludes + several days).
      concludesMs + 5 * 24 * 60 * 60 * 1000,
      emptyTabs,
      null,
      null,
      null,
      { mode: 'zef', rating: 4, text: 'Nice', tags: ['Great examples'] },
    )

    expect(payload.feedback).toEqual({
      mode: 'zef',
      canSubmit: true,
      rating: 4,
      text: 'Nice',
      tags: ['Great examples'],
    })
  })

  it('never allows submission in hidden mode, even inside an open window', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'live',
        schedule,
        concludes,
        zoomLink: null,
        videos: null,
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
        settings: { show_feedback: 1 },
        hostAvatarUrl: null,
        notes: null,
      },
      // Inside the legacy window — irrelevant, the lecture is ZEF-owned.
      scheduleMs + 30 * 60 * 1000,
      emptyTabs,
      null,
      null,
      null,
      { mode: 'hidden', rating: null, text: null, tags: [] },
    )

    expect(payload.feedback).toEqual({
      mode: 'hidden',
      canSubmit: false,
      rating: null,
      text: null,
      tags: [],
    })
  })

  it('does not expose an adaptive recording link before a SAL lecture ends', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'live',
        schedule,
        concludes,
        zoomLink:
          'https://experience-api.masaischool.com/api/adaptive-lecture/abc123/join',
        videos: null,
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
        settings: null,
        hostAvatarUrl: null,
        notes: null,
      },
      // While the lecture is live (during phase).
      scheduleMs + 5 * 60 * 1000,
      emptyTabs,
      null,
      null,
      null,
      { mode: 'legacy', rating: null, text: null, tags: [] },
    )

    expect(payload.livePhase).toBe('during')
    expect(payload.adaptiveRecordingUrl).toBeNull()
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
      null,
      null,
      { mode: 'legacy', rating: null, text: null, tags: [] },
    )

    expect(payload.lectureKind).toBe('video')
    expect(payload.hideVideo).toBe(true)
    expect(payload.hideNotes).toBe(true)
    expect(payload.notes).toBeNull()
    expect(payload.videoUrl).toBeNull()
    expect(payload.hasRecording).toBe(false)
    expect(payload.hostAvatarUrl).toBe('/avatar.png')
  })

  it('treats scrum lectures as the live kind', () => {
    const payload = buildLectureDetailPayload(
      core,
      {
        type: 'scrum',
        schedule,
        concludes,
        zoomLink: 'https://zoom.example/j/2',
        videos: null,
        vimeoDownloadLinks: null,
        vimeoPlayerEmbedUrl: null,
        settings: null,
        hostAvatarUrl: null,
        notes: null,
      },
      new Date(schedule).getTime(),
      emptyTabs,
      null,
      null,
      null,
      { mode: 'legacy', rating: null, text: null, tags: [] },
    )

    expect(payload.lectureKind).toBe('live')
    expect(payload.livePhase).not.toBeNull()
    expect(payload.videoPhase).toBeNull()
  })

  it('throws for unsupported lecture types', () => {
    expect(() =>
      buildLectureDetailPayload(
        core,
        {
          type: 'recorded',
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
        null,
        null,
        { mode: 'legacy', rating: null, text: null, tags: [] },
      ),
    ).toThrow('LECTURE_DETAIL_UNSUPPORTED_TYPE')
  })
})
