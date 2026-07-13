import { describe, expect, it } from 'vitest'

import {
  appendZoomChatToNotes,
  formatZoomChatLinksForNotes,
  parseFinalChatLinks,
} from '../appendZoomChatToNotes'

const links = [
  { url: 'https://github.com/kaseradeepak/Web-Dev', count: 1, posted_by: 'Deepak' },
  { url: 'https://www.menti.com/alnq8ufyou2q', count: 2, posted_by: 'Deepak' },
]

describe('parseFinalChatLinks', () => {
  it('keeps only entries with a non-empty string url', () => {
    const raw = [
      { url: 'https://a.com' },
      { url: '   ' },
      { url: 42 },
      null,
      'nope',
      { posted_by: 'x' },
    ]
    expect(parseFinalChatLinks(raw)).toEqual([{ url: 'https://a.com' }])
  })

  it('returns [] for non-array input', () => {
    expect(parseFinalChatLinks(null)).toEqual([])
    expect(parseFinalChatLinks('[]')).toEqual([])
    expect(parseFinalChatLinks(undefined)).toEqual([])
  })
})

describe('formatZoomChatLinksForNotes', () => {
  it('builds a numbered "Resources shared" block', () => {
    expect(formatZoomChatLinksForNotes(links)).toBe(
      'Resources shared :-\n\n1. https://github.com/kaseradeepak/Web-Dev\n2. https://www.menti.com/alnq8ufyou2q',
    )
  })

  it('returns null when there are no usable links', () => {
    expect(formatZoomChatLinksForNotes([])).toBeNull()
    expect(formatZoomChatLinksForNotes([{ url: '  ' }])).toBeNull()
  })
})

describe('appendZoomChatToNotes', () => {
  it('appends the resources block after existing notes', () => {
    expect(appendZoomChatToNotes('  Lecture notes  ', links)).toBe(
      'Lecture notes\n\nResources shared :-\n\n1. https://github.com/kaseradeepak/Web-Dev\n2. https://www.menti.com/alnq8ufyou2q',
    )
  })

  it('returns only the resources block when notes are empty', () => {
    expect(appendZoomChatToNotes(null, links)).toBe(
      'Resources shared :-\n\n1. https://github.com/kaseradeepak/Web-Dev\n2. https://www.menti.com/alnq8ufyou2q',
    )
    expect(appendZoomChatToNotes('   ', links)).toBe(
      'Resources shared :-\n\n1. https://github.com/kaseradeepak/Web-Dev\n2. https://www.menti.com/alnq8ufyou2q',
    )
  })

  it('returns normalized notes (or null) when there are no links', () => {
    expect(appendZoomChatToNotes('  Only notes  ', [])).toBe('Only notes')
    expect(appendZoomChatToNotes(null, [])).toBeNull()
    expect(appendZoomChatToNotes('   ', null)).toBeNull()
  })
})
