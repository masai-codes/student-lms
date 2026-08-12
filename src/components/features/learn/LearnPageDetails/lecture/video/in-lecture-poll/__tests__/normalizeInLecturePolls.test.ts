import { describe, expect, it } from 'vitest'

import { normalizeInLecturePolls } from '../normalizeInLecturePolls'
import type { InLecturePopupPollElement } from '@/server/learn/lectureDetailTypes'

const poll = (
  id: number,
  startSec: number,
  endSec: number,
  question: string,
  options: unknown = ['Yes', 'No'],
): InLecturePopupPollElement => ({
  id,
  question,
  options,
  status: 'active',
  startSec,
  endSec,
})

describe('normalizeInLecturePolls', () => {
  it('sorts by start and keys by the element id', () => {
    const result = normalizeInLecturePolls(
      [poll(2, 463, 512, 'b?'), poll(1, 215, 357, 'a?')],
      0,
    )
    expect(result).toEqual([
      {
        id: '1',
        startSec: 215,
        endSec: 357,
        question: 'a?',
        options: ['Yes', 'No'],
      },
      {
        id: '2',
        startSec: 463,
        endSec: 512,
        question: 'b?',
        options: ['Yes', 'No'],
      },
    ])
  })

  it('drops windows where start >= end or start is negative', () => {
    const result = normalizeInLecturePolls(
      [poll(1, 300, 300, 'eq?'), poll(2, -5, 100, 'neg?')],
      0,
    )
    expect(result).toEqual([])
  })

  it('drops windows starting at/after the video duration and clamps the end', () => {
    const result = normalizeInLecturePolls(
      [poll(1, 10, 600, 'clamp?'), poll(2, 600, 720, 'past?')],
      // duration 400s: 'past' starts after the end (dropped); 'clamp' end clamped to 400
      400,
    )
    expect(result).toEqual([
      {
        id: '1',
        startSec: 10,
        endSec: 400,
        question: 'clamp?',
        options: ['Yes', 'No'],
      },
    ])
  })

  it('drops a blank question', () => {
    const result = normalizeInLecturePolls([poll(1, 10, 20, '   ')], 0)
    expect(result).toEqual([])
  })

  it('drops options that are missing, non-array, or fewer than two strings', () => {
    const result = normalizeInLecturePolls(
      [
        poll(1, 10, 20, 'a?', null),
        poll(2, 30, 40, 'b?', 'not-an-array'),
        poll(3, 50, 60, 'c?', ['only one']),
        poll(4, 70, 80, 'd?', ['', '  ']),
      ],
      0,
    )
    expect(result).toEqual([])
  })
})
