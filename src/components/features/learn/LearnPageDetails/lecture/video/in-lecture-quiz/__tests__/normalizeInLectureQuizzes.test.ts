import { describe, expect, it } from 'vitest'

import {
  normalizeInLectureQuizzes,
  parseTimestampToSeconds,
} from '../normalizeInLectureQuizzes'
import type { InLecturePopupQuiz } from '@/server/learn/lectureDetailTypes'

const quiz = (
  start: string,
  end: string,
  assessmentTemplate: string,
): InLecturePopupQuiz => ({
  timeStamp: { start, end },
  assessmentTemplate,
})

describe('parseTimestampToSeconds', () => {
  it('parses HH:MM:SS', () => {
    expect(parseTimestampToSeconds('00:03:35')).toBe(215)
    expect(parseTimestampToSeconds('01:00:00')).toBe(3600)
  })

  it('parses MM:SS', () => {
    expect(parseTimestampToSeconds('05:57')).toBe(357)
  })

  it('rejects malformed input', () => {
    expect(parseTimestampToSeconds('abc')).toBeNull()
    expect(parseTimestampToSeconds('1:2:3:4')).toBeNull()
    expect(parseTimestampToSeconds('-1:00')).toBeNull()
  })
})

describe('normalizeInLectureQuizzes', () => {
  it('parses, sorts, and keys quizzes', () => {
    const result = normalizeInLectureQuizzes(
      [quiz('00:07:43', '00:08:32', 'b'), quiz('00:03:35', '00:05:57', 'a')],
      0,
    )
    expect(result).toEqual([
      { id: 'a@215', startSec: 215, endSec: 357, assessmentTemplate: 'a' },
      { id: 'b@463', startSec: 463, endSec: 512, assessmentTemplate: 'b' },
    ])
  })

  it('drops windows where start >= end or timestamps are malformed', () => {
    const result = normalizeInLectureQuizzes(
      [quiz('00:05:00', '00:05:00', 'eq'), quiz('bad', '00:05:00', 'x')],
      0,
    )
    expect(result).toEqual([])
  })

  it('drops windows starting at/after the video duration and clamps the end', () => {
    const result = normalizeInLectureQuizzes(
      [quiz('00:00:10', '00:10:00', 'clamp'), quiz('00:10:00', '00:12:00', 'past')],
      // duration 400s: 'past' starts after the end (dropped); 'clamp' end clamped to 400
      400,
    )
    expect(result).toEqual([
      { id: 'clamp@10', startSec: 10, endSec: 400, assessmentTemplate: 'clamp' },
    ])
  })
})
