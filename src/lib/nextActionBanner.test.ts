import { describe, expect, it } from 'vitest'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import {
  EVALUATION_TICK_MS,
  LECTURE_TICK_MS,
  formatCountdown,
  resolveNextActionBannerView,
} from './nextActionBanner'

// parseMysqlDatetimeIST reads naive datetimes as IST wall-clock. These fixtures
// therefore resolve to fixed UTC instants (IST = UTC+5:30) we can reason about.
const START_IST = '2026-07-09 10:00:00' // 04:30:00Z
const END_IST = '2026-07-09 11:00:00' // 05:30:00Z
const START_MS = Date.parse('2026-07-09T04:30:00Z')
const END_MS = Date.parse('2026-07-09T05:30:00Z')

function makeEvent(overrides: Partial<NavbarPillEvent> = {}): NavbarPillEvent {
  return {
    id: 42,
    title: 'DSA Live Class',
    schedule: START_IST,
    concludes: END_IST,
    eventType: 'live',
    zoomLink: 'https://zoom.example/j/1',
    ...overrides,
  }
}

describe('resolveNextActionBannerView', () => {
  it('returns null when there is no event', () => {
    expect(resolveNextActionBannerView(null, START_MS)).toBeNull()
    expect(resolveNextActionBannerView(undefined, START_MS)).toBeNull()
  })

  it('returns null when a timestamp is missing', () => {
    expect(resolveNextActionBannerView(makeEvent({ schedule: '' }), START_MS)).toBeNull()
    expect(resolveNextActionBannerView(makeEvent({ concludes: '' }), START_MS)).toBeNull()
  })

  it('returns null once the event has concluded', () => {
    expect(resolveNextActionBannerView(makeEvent(), END_MS)).toBeNull()
    expect(resolveNextActionBannerView(makeEvent(), END_MS + 1)).toBeNull()
  })

  it('describes an upcoming lecture with a rounded countdown', () => {
    const view = resolveNextActionBannerView(makeEvent(), START_MS - 3 * 60_000)
    expect(view).toMatchObject({
      isStarted: false,
      label: 'Upcoming lecture',
      countdownMs: 3 * 60_000,
      precise: false,
      ctaText: 'View',
      tickMs: LECTURE_TICK_MS,
    })
  })

  it('describes a started lecture with no countdown', () => {
    const view = resolveNextActionBannerView(makeEvent(), START_MS + 60_000)
    expect(view).toMatchObject({
      isStarted: true,
      label: 'Lecture has started',
      countdownMs: null,
      ctaText: 'View',
    })
  })

  it('describes an upcoming evaluation with a precise, fine-grained countdown', () => {
    const view = resolveNextActionBannerView(
      makeEvent({ eventType: 'evaluation', zoomLink: null }),
      START_MS - 90_000,
    )
    expect(view).toMatchObject({
      isStarted: false,
      label: 'Upcoming evaluation',
      countdownMs: 90_000,
      precise: true,
      ctaText: 'Start',
      tickMs: EVALUATION_TICK_MS,
    })
  })

  it('labels a started evaluation', () => {
    const view = resolveNextActionBannerView(
      makeEvent({ eventType: 'evaluation' }),
      START_MS + 5_000,
    )
    expect(view?.label).toBe('Evaluation has started')
  })

  it('never reports a negative countdown right at the start boundary', () => {
    const view = resolveNextActionBannerView(makeEvent(), START_MS - 1)
    expect(view?.countdownMs).toBe(1)
  })
})

describe('formatCountdown', () => {
  it('formats precise countdowns as zero-padded MM:SS', () => {
    expect(formatCountdown(90_000, true)).toBe('01:30')
    expect(formatCountdown(5_000, true)).toBe('00:05')
    expect(formatCountdown(3_661_000, true)).toBe('61:01')
  })

  it('rounds lecture countdowns up to whole minutes', () => {
    expect(formatCountdown(3 * 60_000, false)).toBe('3 mins')
    expect(formatCountdown(2 * 60_000 + 1, false)).toBe('3 mins')
  })

  it('shows at least 1 min and never a negative value', () => {
    expect(formatCountdown(0, false)).toBe('1 mins')
    expect(formatCountdown(-5_000, false)).toBe('1 mins')
    expect(formatCountdown(-5_000, true)).toBe('00:00')
  })
})
