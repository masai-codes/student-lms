import { describe, expect, it } from 'vitest'

import { parseLectureSettings } from '../parseLectureSettings'

describe('parseLectureSettings', () => {
  it('defaults hideVideo to false for invalid input', () => {
    expect(parseLectureSettings(null)).toEqual({ hideVideo: false })
    expect(parseLectureSettings('x')).toEqual({ hideVideo: false })
  })

  it('reads hide_video from settings object', () => {
    expect(parseLectureSettings({ hide_video: true })).toEqual({ hideVideo: true })
    expect(parseLectureSettings({ hide_video: false })).toEqual({ hideVideo: false })
  })
})
