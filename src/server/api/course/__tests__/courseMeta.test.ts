import { describe, expect, it } from 'vitest'
import {
  arr,
  asRecord,
  computeCourseProgress,
  readCourseTimeline,
  resolveCourseLogo,
  resolveCourseTitle,
  resolveInstituteName,
  str,
} from '../courseMeta'

describe('courseMeta primitives', () => {
  it('str returns the string, or the fallback for non-strings', () => {
    expect(str('hello')).toBe('hello')
    expect(str(42)).toBe('')
    expect(str(null, 'fb')).toBe('fb')
    expect(str(undefined, 'fb')).toBe('fb')
  })

  it('arr returns arrays untouched and everything else as empty', () => {
    expect(arr<number>([1, 2])).toEqual([1, 2])
    expect(arr({ a: 1 })).toEqual([])
    expect(arr(null)).toEqual([])
  })

  it('asRecord accepts plain objects only', () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 })
    expect(asRecord([1, 2])).toEqual({})
    expect(asRecord(null)).toEqual({})
    expect(asRecord('x')).toEqual({})
  })
})

describe('resolveCourseTitle', () => {
  it('prefers meta.courseTitle', () => {
    expect(resolveCourseTitle({ courseTitle: 'AI & ML' }, 'Batch 42')).toBe(
      'AI & ML',
    )
  })

  it('falls back to the batch name when the title is missing or blank', () => {
    expect(resolveCourseTitle({}, 'Batch 42')).toBe('Batch 42')
    expect(resolveCourseTitle({ courseTitle: '   ' }, 'Batch 42')).toBe(
      'Batch 42',
    )
    expect(resolveCourseTitle({ courseTitle: 7 }, 'Batch 42')).toBe('Batch 42')
  })
})

describe('resolveInstituteName', () => {
  it('reads instituteName, then institute, then collegeName', () => {
    expect(resolveInstituteName({ instituteName: 'IIT Patna' })).toBe(
      'IIT Patna',
    )
    expect(resolveInstituteName({ institute: 'IIT Guwahati' })).toBe(
      'IIT Guwahati',
    )
    expect(resolveInstituteName({ collegeName: 'IIT Ropar' })).toBe('IIT Ropar')
  })

  it('defaults to Masai when absent or blank', () => {
    expect(resolveInstituteName({})).toBe('Masai')
    expect(resolveInstituteName({ instituteName: '  ' })).toBe('Masai')
  })
})

describe('resolveCourseLogo', () => {
  it('returns the trimmed url, or null when absent/blank', () => {
    expect(resolveCourseLogo({ courseLogo: ' https://x/y.png ' })).toBe(
      'https://x/y.png',
    )
    expect(resolveCourseLogo({ courseLogo: '' })).toBeNull()
    expect(resolveCourseLogo({})).toBeNull()
  })
})

describe('readCourseTimeline', () => {
  it('normalises the admin-authored timeLine/mileStone shape', () => {
    expect(
      readCourseTimeline({
        courseTimeline: [{ timeLine: '2026-01-01', mileStone: 'Kickoff' }],
      }),
    ).toEqual([{ date: '2026-01-01', label: 'Kickoff' }])
  })

  it('accepts the legacy date/milestone and date/label aliases', () => {
    expect(
      readCourseTimeline({
        courseTimeline: [
          { date: '2026-02-01', milestone: 'Mid term' },
          { timeline: '2026-03-01', label: 'Finals' },
        ],
      }),
    ).toEqual([
      { date: '2026-02-01', label: 'Mid term' },
      { date: '2026-03-01', label: 'Finals' },
    ])
  })

  it('drops rows missing a date or a label, and a non-array timeline', () => {
    expect(
      readCourseTimeline({
        courseTimeline: [
          { timeLine: '2026-01-01' },
          { mileStone: 'Orphan label' },
          null,
          { timeLine: '2026-04-01', mileStone: 'Graduation' },
        ],
      }),
    ).toEqual([{ date: '2026-04-01', label: 'Graduation' }])

    expect(readCourseTimeline({ courseTimeline: 'nope' })).toEqual([])
    expect(readCourseTimeline({})).toEqual([])
  })
})

describe('computeCourseProgress', () => {
  const start = Date.UTC(2026, 0, 1)
  const end = Date.UTC(2026, 0, 11) // 10-day span
  const milestones = [
    { date: '2026-01-11', label: 'End' },
    { date: '2026-01-01', label: 'Start' }, // deliberately out of order
  ]

  it('reports the share of the calendar elapsed, regardless of input order', () => {
    expect(computeCourseProgress(milestones, Date.UTC(2026, 0, 6))).toBe(50)
    expect(computeCourseProgress(milestones, Date.UTC(2026, 0, 3))).toBe(20)
  })

  it('clamps to 0 before the program starts and 100 after it ends', () => {
    expect(computeCourseProgress(milestones, Date.UTC(2025, 11, 1))).toBe(0)
    expect(computeCourseProgress(milestones, Date.UTC(2027, 0, 1))).toBe(100)
  })

  it('returns exactly 0 and 100 at the boundaries', () => {
    expect(computeCourseProgress(milestones, start)).toBe(0)
    expect(computeCourseProgress(milestones, end)).toBe(100)
  })

  it('returns 0 when there is nothing measurable', () => {
    expect(computeCourseProgress([])).toBe(0)
    expect(
      computeCourseProgress([{ date: 'not-a-date', label: 'X' }], end),
    ).toBe(0)
    // Single milestone / zero-length span — no meaningful percentage.
    expect(
      computeCourseProgress([{ date: '2026-01-01', label: 'X' }], end),
    ).toBe(0)
  })

  it('ignores unparseable dates alongside valid ones', () => {
    expect(
      computeCourseProgress(
        [...milestones, { date: 'garbage', label: 'Bad row' }],
        Date.UTC(2026, 0, 6),
      ),
    ).toBe(50)
  })

  it('defaults `now` to the current time', () => {
    expect(
      computeCourseProgress([
        { date: '2000-01-01', label: 'Long ago' },
        { date: '2000-06-01', label: 'Also long ago' },
      ]),
    ).toBe(100)
  })
})
