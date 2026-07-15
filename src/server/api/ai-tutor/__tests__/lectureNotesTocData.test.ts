import { describe, expect, it } from 'vitest'
import {
  mergeLectureNotesRagData,
  readNotesRaggedFromLectureData,
  readNotesTocFromLectureData,
} from '../services/lectureNotesTocData'

describe('lectureNotesTocData', () => {
  it('reads a stored notes table of contents', () => {
    expect(
      readNotesTocFromLectureData({ notesToc: '  - Arrays\n  - Sorting  ' }),
    ).toBe('- Arrays\n  - Sorting')
  })

  it('reads the notesRagged flag', () => {
    expect(readNotesRaggedFromLectureData({ notesRagged: false })).toBe(false)
    expect(readNotesRaggedFromLectureData({ notesRagged: true })).toBe(true)
    expect(readNotesRaggedFromLectureData({})).toBeNull()
  })

  it('merges ragged notes with a table of contents', () => {
    expect(
      mergeLectureNotesRagData({ existing: true }, {
        notesRagged: true,
        notesToc: '- Topic A',
      }),
    ).toEqual({
      existing: true,
      notesRagged: true,
      notesToc: '- Topic A',
    })
  })

  it('stores notesRagged false and clears any stored table of contents', () => {
    expect(
      mergeLectureNotesRagData(
        { existing: true, notesToc: '- Old topic' },
        { notesRagged: false },
      ),
    ).toEqual({
      existing: true,
      notesRagged: false,
    })
  })
})
