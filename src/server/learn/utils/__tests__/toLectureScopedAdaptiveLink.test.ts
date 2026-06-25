import { describe, expect, it } from 'vitest'

import { toLectureScopedAdaptiveLink } from '../toLectureScopedAdaptiveLink'

const BASE = 'https://experience-api.masaischool.com'

describe('toLectureScopedAdaptiveLink', () => {
  it('rewrites the meeting id segment to the lecture id', () => {
    expect(
      toLectureScopedAdaptiveLink(
        `${BASE}/api/adaptive-lecture/abc123hexmeeting/join`,
        572,
      ),
    ).toBe(`${BASE}/api/adaptive-lecture/572/join`)
  })

  it('leaves non-adaptive zoom links unchanged', () => {
    expect(toLectureScopedAdaptiveLink('https://zoom.us/j/99', 572)).toBe(
      'https://zoom.us/j/99',
    )
  })

  it('returns null for null and empty input', () => {
    expect(toLectureScopedAdaptiveLink(null, 572)).toBeNull()
    expect(toLectureScopedAdaptiveLink('', 572)).toBe('')
  })
})
