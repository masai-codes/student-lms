import { describe, expect, it } from 'vitest'

import { parseLectureSettings } from '../parseLectureSettings'

describe('parseLectureSettings', () => {
  it('defaults flags to false for invalid input', () => {
    expect(parseLectureSettings(null)).toEqual({
      hideVideo: false,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
    expect(parseLectureSettings('x')).toEqual({
      hideVideo: false,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
  })

  it('reads hide_video from settings object', () => {
    expect(parseLectureSettings({ hide_video: true })).toEqual({
      hideVideo: true,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
    expect(parseLectureSettings({ hide_video: false })).toEqual({
      hideVideo: false,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
  })

  it('treats integer hide_video (1/0) like the legacy LMS truthy check', () => {
    expect(parseLectureSettings({ hide_video: 1 }).hideVideo).toBe(true)
    expect(parseLectureSettings({ hide_video: 0 }).hideVideo).toBe(false)
  })

  it('reads hide_notes from settings object', () => {
    expect(parseLectureSettings({ hide_notes: true })).toEqual({
      hideVideo: false,
      hideNotes: true,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
    expect(parseLectureSettings({ hide_notes: 1 })).toEqual({
      hideVideo: false,
      hideNotes: true,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
    expect(parseLectureSettings({ hide_notes: 0 })).toEqual({
      hideVideo: false,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    })
  })

  it('reads show_feedback from settings object', () => {
    expect(parseLectureSettings({ show_feedback: true }).showFeedback).toBe(
      true,
    )
    expect(parseLectureSettings({ show_feedback: 1 }).showFeedback).toBe(true)
    expect(parseLectureSettings({ show_feedback: 0 }).showFeedback).toBe(false)
  })

  it('parses valid in-lecture popup quizzes and drops malformed entries', () => {
    const valid = {
      timeStamp: { start: '00:01:00', end: '00:02:00' },
      assessmentTemplate: 'tmpl-1',
    }
    expect(
      parseLectureSettings({
        inLecturePopupQuiz: [
          valid,
          { assessmentTemplate: 'no-timestamp' },
          { timeStamp: { start: '00:00:00', end: '00:00:10' } },
          'not-an-object',
        ],
      }).inLecturePopupQuiz,
    ).toEqual([valid])
  })

  it('defaults in-lecture popup quiz to an empty array for non-array input', () => {
    expect(
      parseLectureSettings({ inLecturePopupQuiz: 'nope' }).inLecturePopupQuiz,
    ).toEqual([])
  })
})
