import { describe, expect, it } from 'vitest'

import {
  isSupportedResourceLectureType,
  normalizeResourceKind,
} from '../normalizeResourceKind'

describe('normalizeResourceKind', () => {
  it('maps pre-read category variants', () => {
    expect(normalizeResourceKind('pre-read')).toBe('pre-read')
    expect(normalizeResourceKind('Pre-Reads')).toBe('pre-read')
    expect(normalizeResourceKind('pre_read')).toBe('pre-read')
  })

  it('maps notes categories', () => {
    expect(normalizeResourceKind('notes')).toBe('notes')
    expect(normalizeResourceKind('Note')).toBe('notes')
  })

  it('falls back to material for other categories', () => {
    expect(normalizeResourceKind('reference')).toBe('material')
    expect(normalizeResourceKind('reading')).toBe('material')
  })
})

describe('isSupportedResourceLectureType', () => {
  it('accepts reading type only', () => {
    expect(isSupportedResourceLectureType('reading')).toBe(true)
    expect(isSupportedResourceLectureType('video')).toBe(false)
  })
})
