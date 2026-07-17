import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAgreementSteps,
  buildReferenceNumber,
  computeAgreementCountdown,
  hasSignableAgreement,
} from '../agreementShared'

describe('buildAgreementSteps', () => {
  it('drops reserved keys and hidden/invalid docs', () => {
    const steps = buildAgreementSteps({
      shouldModalBeVisible: true,
      program_agreement: { heading: 'Program', pdfUrl: 'https://x/p.pdf' },
      secret: {
        heading: 'Hidden',
        pdfUrl: 'https://x/h.pdf',
        hidePolicy: true,
      },
      broken: { heading: '', pdfUrl: 'https://x/b.pdf' },
    })
    expect(steps.map((s) => s.key)).toEqual(['program_agreement'])
  })

  it('orders unordered before ordered, then ascending by order', () => {
    const steps = buildAgreementSteps({
      posh: { heading: 'POSH', pdfUrl: 'u', order: 2 },
      program_agreement: { heading: 'Program', pdfUrl: 'u' }, // unordered
      grading: { heading: 'Grading', pdfUrl: 'u', order: 1 },
    })
    expect(steps.map((s) => s.key)).toEqual([
      'program_agreement',
      'grading',
      'posh',
    ])
  })

  it('falls back to the default order for unordered known keys', () => {
    const steps = buildAgreementSteps({
      posh_compliance: { heading: 'POSH', pdfUrl: 'u' },
      program_agreement: { heading: 'Program', pdfUrl: 'u' },
      grading_policy: { heading: 'Grading', pdfUrl: 'u' },
    })
    expect(steps.map((s) => s.key)).toEqual([
      'program_agreement',
      'grading_policy',
      'posh_compliance',
    ])
  })
})

describe('computeAgreementCountdown', () => {
  const HOUR_MS = 60 * 60 * 1000
  const DAY_MS = 24 * HOUR_MS
  // `istNow()` is `Date.now() + 5.5h`; anchor a fixed clock so it's deterministic.
  const NOW = new Date('2026-01-08T00:00:00.000Z')
  const istNowMs = NOW.getTime() + 5.5 * HOUR_MS
  const viewedAgo = (ms: number) => new Date(istNowMs - ms).toISOString()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('shows the full window in days when never viewed', () => {
    expect(computeAgreementCountdown(null)).toEqual({
      daysSinceFirstView: 0,
      daysLeft: 7,
      hoursLeft: null,
      isClosable: true,
    })
  })

  it('counts down in days while more than a day remains', () => {
    expect(computeAgreementCountdown(viewedAgo(2 * DAY_MS))).toEqual({
      daysSinceFirstView: 2,
      daysLeft: 5,
      hoursLeft: null,
      isClosable: true,
    })
  })

  it('switches to hours when under a day remains', () => {
    // 6d19h elapsed → ~5h left in the 7-day window.
    expect(
      computeAgreementCountdown(viewedAgo(7 * DAY_MS - 5 * HOUR_MS)),
    ).toEqual({
      daysSinceFirstView: 6,
      daysLeft: 0,
      hoursLeft: 5,
      isClosable: true,
    })
  })

  it('reports at least one hour in the final stretch', () => {
    expect(
      computeAgreementCountdown(viewedAgo(7 * DAY_MS - 10 * 60 * 1000))
        .hoursLeft,
    ).toBe(1)
  })

  it('is no longer closable once the window has elapsed', () => {
    expect(computeAgreementCountdown(viewedAgo(8 * DAY_MS))).toEqual({
      daysSinceFirstView: 8,
      daysLeft: 0,
      hoursLeft: null,
      isClosable: false,
    })
  })

  it('falls back to the full window for an unparseable timestamp', () => {
    expect(computeAgreementCountdown('not-a-date')).toEqual({
      daysSinceFirstView: 0,
      daysLeft: 7,
      hoursLeft: null,
      isClosable: true,
    })
  })
})

describe('hasSignableAgreement / buildReferenceNumber', () => {
  it('detects a signable agreement', () => {
    expect(hasSignableAgreement({ shouldModalBeVisible: true })).toBe(false)
    expect(
      hasSignableAgreement({
        program_agreement: { heading: 'P', pdfUrl: 'u' },
      }),
    ).toBe(true)
    expect(hasSignableAgreement(null)).toBe(false)
  })

  it('builds the TC reference number', () => {
    expect(buildReferenceNumber(42, 7)).toBe('TC-42-section_7')
  })
})
