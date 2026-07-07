import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeGuidedTourProgress,
  fracValue,
  isProgressComplete,
} from '../guidedTourProgress'

const hoisted = vi.hoisted(() => ({ execute: vi.fn(), isIHub: false }))

vi.mock('@/db', () => ({ db: { execute: hoisted.execute } }))
vi.mock('@/server/auth/v2/portalContext', () => ({
  isIHubPortalRequest: () => hoisted.isIHub,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.isIHub = false
})

/** Queue db.execute results in the exact order the service reads them. */
function queue(...results: Array<Array<Record<string, unknown>>>) {
  for (const r of results) hoisted.execute.mockResolvedValueOnce(r)
}

describe('fracValue', () => {
  it('parses "n/d" into a ratio and guards bad input', () => {
    expect(fracValue('3/4')).toBe(0.75)
    expect(fracValue('0/5')).toBe(0)
    expect(fracValue(undefined)).toBe(0)
    expect(fracValue('2/0')).toBe(0)
  })
})

describe('isProgressComplete', () => {
  it('is complete when nothing is required or the numerator caught up', () => {
    expect(isProgressComplete({ completed: 0, total: 0 })).toBe(true)
    expect(isProgressComplete({ completed: 5, total: 5 })).toBe(true)
    expect(isProgressComplete({ completed: 2, total: 5 })).toBe(false)
  })
})

describe('computeGuidedTourProgress', () => {
  it('LMS-only (partial fees): total = lectures + 2 fixed steps, program is null', async () => {
    queue(
      [{ id: 100 }], // latest lms-walkthrough-web section
      [{ id: 1 }, { id: 2 }], // lms lectures
      [{ lecture_id: 1 }], // completed lms lectures
    )

    const result = await computeGuidedTourProgress(
      42,
      7,
      false,
      { profile_pic: 'https://cdn.example.com/me.jpg' }, // photo → +1
      null,
      true, // device token → +1
    )

    expect(result.program).toBeNull()
    // 2 lectures + 2 fixed; 1 video done + photo + device = 3/4
    expect(result.lms).toEqual({ completed: 3, total: 4 })
  })

  it('counts neither fixed step when there is no photo and no device', async () => {
    queue(
      [{ id: 100 }],
      [{ id: 1 }, { id: 2 }],
      [{ lecture_id: 1 }, { lecture_id: 2 }],
    )

    const result = await computeGuidedTourProgress(
      42,
      7,
      false,
      {},
      null,
      false,
    )

    expect(result.lms).toEqual({ completed: 2, total: 4 })
  })

  it('iHub: drops the download-app step from numerator and denominator', async () => {
    hoisted.isIHub = true
    queue(
      [{ id: 100 }], // latest lms-walkthrough-web section
      [{ id: 1 }, { id: 2 }], // lms lectures
      [{ lecture_id: 1 }], // completed lms lectures
    )

    const result = await computeGuidedTourProgress(
      42,
      7,
      false,
      { profile_pic: 'https://cdn.example.com/me.jpg' }, // photo → +1
      null,
      true, // device token present, but iHub ignores it
    )

    // 2 lectures + 1 fixed step (profile photo only); download-app omitted.
    expect(result.lms).toEqual({ completed: 2, total: 3 })
    expect(result.program).toBeNull()
  })

  it('full fees: program total includes the agreement and counts it once signed', async () => {
    queue(
      [{ id: 100 }], // lms section
      [{ id: 1 }, { id: 2 }], // lms lectures
      [{ lecture_id: 1 }, { lecture_id: 2 }], // lms done
      [
        {
          id: 7,
          agreements: JSON.stringify({
            clause: { pdfUrl: 'https://x/a.pdf', heading: 'Terms' },
          }),
        },
      ], // enrolled section w/ agreement
      [{ id: 200 }], // program section
      [{ id: 5 }], // program lectures
      [{ lecture_id: 5 }], // program done
    )

    const result = await computeGuidedTourProgress(
      42,
      7,
      true,
      { profile_pic: 'https://cdn.example.com/me.jpg' },
      { agreements: { section_7: { haveAcceptedLegalAgreement: true } } },
      true,
    )

    // 1 program lecture + 1 agreement; lecture done + agreement signed = 2/2
    expect(result.program).toEqual({ completed: 2, total: 2 })
    expect(result.lms).toEqual({ completed: 4, total: 4 })
  })
})
