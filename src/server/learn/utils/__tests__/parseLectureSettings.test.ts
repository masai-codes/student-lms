import { describe, expect, it } from 'vitest'

import { parseLectureSettings } from '../parseLectureSettings'

describe('parseLectureSettings', () => {
  it('defaults flags to false for invalid input', () => {
    expect(parseLectureSettings(null)).toEqual({
      hideVideo: false,
      hideNotes: false,
    })
    expect(parseLectureSettings('x')).toEqual({
      hideVideo: false,
      hideNotes: false,
    })
  })

  it('reads hide_video from settings object', () => {
    expect(parseLectureSettings({ hide_video: true })).toEqual({
      hideVideo: true,
      hideNotes: false,
    })
    expect(parseLectureSettings({ hide_video: false })).toEqual({
      hideVideo: false,
      hideNotes: false,
    })
  })

  it('reads hide_notes from settings object', () => {
    expect(parseLectureSettings({ hide_notes: true })).toEqual({
      hideVideo: false,
      hideNotes: true,
    })
    expect(parseLectureSettings({ hide_notes: 1 })).toEqual({
      hideVideo: false,
      hideNotes: true,
    })
    expect(parseLectureSettings({ hide_notes: 0 })).toEqual({
      hideVideo: false,
      hideNotes: false,
    })
  })
})
