import { describe, expect, it } from 'vitest'

import {
  isAssignmentLinkedToLecture,
  readAssociatedLectureId,
} from '../parseLectureDataJson'

describe('parseLectureDataJson', () => {
  it('reads associated lecture id from lecture data', () => {
    expect(
      readAssociatedLectureId({ associatedLecture: { id: 42 } }),
    ).toBe(42)
  })

  it('detects assignment links', () => {
    expect(
      isAssignmentLinkedToLecture({ associatedLecture: { id: 7 } }, 7),
    ).toBe(true)
    expect(
      isAssignmentLinkedToLecture(
        { associatedLecture: [{ id: 7 }, { id: 8 }] },
        8,
      ),
    ).toBe(true)
    expect(isAssignmentLinkedToLecture({}, 7)).toBe(false)
  })
})
