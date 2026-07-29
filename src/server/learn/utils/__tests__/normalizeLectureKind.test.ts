import { describe, expect, it } from 'vitest'

import { normalizeLectureKind } from '@/server/learn/utils/normalizeLectureKind'

describe('normalizeLectureKind', () => {
  it('maps live and scrum to the live kind', () => {
    expect(normalizeLectureKind('live')).toBe('live')
    expect(normalizeLectureKind('scrum')).toBe('live')
    expect(normalizeLectureKind(' Scrum ')).toBe('live')
  })

  it('maps video lectures to the video kind', () => {
    expect(normalizeLectureKind('video')).toBe('video')
  })

  it('returns null for unsupported lecture types', () => {
    expect(normalizeLectureKind('reading')).toBeNull()
    expect(normalizeLectureKind('blended-learning')).toBeNull()
  })
})
