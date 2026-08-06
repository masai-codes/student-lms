import { describe, expect, it } from 'vitest'

import { resolveJoinLiveButtonState } from '../resolveJoinLiveButtonState'

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'
const zoomLink = 'https://zoom.example/j/1'

describe('resolveJoinLiveButtonState', () => {
  it('hides when link or schedule is missing', () => {
    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: Date.now(),
        zoomLink: null,
      }),
    ).toBe('hidden')
  })

  it('still needs a schedule for an IVS lecture', () => {
    expect(
      resolveJoinLiveButtonState({
        schedule: null,
        concludes,
        nowMs: Date.now(),
        zoomLink: null,
        isIvsRedirection: true,
      }),
    ).toBe('hidden')
  })

  it('shows for an IVS lecture with no zoom link', () => {
    const scheduleMs = new Date(schedule).getTime()

    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: scheduleMs - 7 * 60 * 1000,
        zoomLink: null,
        isIvsRedirection: true,
      }),
    ).toBe('disabled')

    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: scheduleMs - 2 * 60 * 1000,
        zoomLink: null,
        isIvsRedirection: true,
      }),
    ).toBe('active')
  })

  it('disables then activates around start', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: scheduleMs - 7 * 60 * 1000,
        zoomLink,
      }),
    ).toBe('disabled')

    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: scheduleMs - 2 * 60 * 1000,
        zoomLink,
      }),
    ).toBe('active')
  })

  it('stays active for 30 minutes after the lecture concludes, then hides', () => {
    const concludesMs = new Date(concludes).getTime()
    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: concludesMs + 20 * 60 * 1000,
        zoomLink,
      }),
    ).toBe('active')

    expect(
      resolveJoinLiveButtonState({
        schedule,
        concludes,
        nowMs: concludesMs + 31 * 60 * 1000,
        zoomLink,
      }),
    ).toBe('hidden')
  })
})
