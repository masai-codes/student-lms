import { describe, expect, it } from 'vitest'

import {
  progressUpdateCutoffSeconds,
  shouldSaveVideoProgress,
} from '../videoProgressSavePolicy'

describe('videoProgressSavePolicy', () => {
  it('uses a fixed 30s cutoff regardless of video length', () => {
    expect(progressUpdateCutoffSeconds(100)).toBe(30)
    expect(progressUpdateCutoffSeconds(10_000)).toBe(30)
  })

  it('saves when timer exceeds cutoff', () => {
    expect(
      shouldSaveVideoProgress({
        timer: 35,
        totalDuration: 100,
        failCount: 0,
        nextApiRetryAt: null,
        isUpdating: false,
      }),
    ).toBe(true)
  })

  it('blocks save while updating or before cutoff', () => {
    expect(
      shouldSaveVideoProgress({
        timer: 5,
        totalDuration: 100,
        failCount: 0,
        nextApiRetryAt: null,
        isUpdating: false,
      }),
    ).toBe(false)
    expect(
      shouldSaveVideoProgress({
        timer: 40,
        totalDuration: 100,
        failCount: 0,
        nextApiRetryAt: null,
        isUpdating: true,
      }),
    ).toBe(false)
  })

  it('forces save when force flag is set', () => {
    expect(
      shouldSaveVideoProgress({
        timer: 1,
        totalDuration: 100,
        failCount: 0,
        nextApiRetryAt: null,
        isUpdating: false,
        force: true,
      }),
    ).toBe(true)
  })
})
