import { describe, expect, it } from 'vitest'

import { normalizeInLectureQuizzes } from '../normalizeInLectureQuizzes'
import type { InLecturePopupQuizElement } from '@/server/learn/lectureDetailTypes'

const quiz = (
  id: number,
  startSec: number,
  endSec: number,
  assessmentId: string,
): InLecturePopupQuizElement => ({
  id,
  assessmentId,
  status: 'active',
  startSec,
  endSec,
  submittedAt: null,
})

describe('normalizeInLectureQuizzes', () => {
  it('sorts by start and keys by the element id', () => {
    const result = normalizeInLectureQuizzes(
      [quiz(2, 463, 512, 'b'), quiz(1, 215, 357, 'a')],
      0,
    )
    expect(result).toEqual([
      { id: '1', startSec: 215, endSec: 357, assessmentId: 'a' },
      { id: '2', startSec: 463, endSec: 512, assessmentId: 'b' },
    ])
  })

  it('drops windows where start >= end or start is negative', () => {
    const result = normalizeInLectureQuizzes(
      [quiz(1, 300, 300, 'eq'), quiz(2, -5, 100, 'neg')],
      0,
    )
    expect(result).toEqual([])
  })

  it('drops windows starting at/after the video duration and clamps the end', () => {
    const result = normalizeInLectureQuizzes(
      [quiz(1, 10, 600, 'clamp'), quiz(2, 600, 720, 'past')],
      // duration 400s: 'past' starts after the end (dropped); 'clamp' end clamped to 400
      400,
    )
    expect(result).toEqual([
      { id: '1', startSec: 10, endSec: 400, assessmentId: 'clamp' },
    ])
  })
})
