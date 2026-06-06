import { describe, expect, it } from 'vitest'
import {
  parseContentWithTags,
  parseTagsInput,
  serializeContentWithTags,
} from './discussionTags'

describe('parseTagsInput', () => {
  it('splits, trims, drops empties and de-dupes (case-insensitive)', () => {
    expect(parseTagsInput(' Career , Interviews ,career,, ')).toEqual([
      'Career',
      'Interviews',
    ])
  })

  it('returns an empty list for blank input', () => {
    expect(parseTagsInput('   ')).toEqual([])
  })
})

describe('serializeContentWithTags / parseContentWithTags', () => {
  it('appends a marker and round-trips back to content + tags', () => {
    const stored = serializeContentWithTags('<p>Hello</p>', [
      'Career',
      'Interviews',
    ])
    expect(stored).toBe('<p>Hello</p><!--tags:Career,Interviews-->')

    expect(parseContentWithTags(stored)).toEqual({
      content: '<p>Hello</p>',
      tags: ['Career', 'Interviews'],
    })
  })

  it('leaves content untouched when there are no tags', () => {
    expect(serializeContentWithTags('<p>Hi</p>', [])).toBe('<p>Hi</p>')
    expect(parseContentWithTags('<p>Hi</p>')).toEqual({
      content: '<p>Hi</p>',
      tags: [],
    })
  })

  it('sanitizes characters that would corrupt the marker', () => {
    const stored = serializeContentWithTags('<p>x</p>', ['a,b', 'c<d>'])
    expect(parseContentWithTags(stored).tags).toEqual(['a b', 'c d'])
  })
})
