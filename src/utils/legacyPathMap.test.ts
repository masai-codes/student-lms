import { describe, expect, it } from 'vitest'
import { mapToLegacyPath } from './legacyPathMap'

describe('mapToLegacyPath', () => {
  it('maps the learn-nested discussions page to the old LMS route', () => {
    expect(mapToLegacyPath('/learn/discussions')).toBe('/discussions')
  })

  it('unnests learn detail pages', () => {
    expect(mapToLegacyPath('/learn/lectures/123')).toBe('/lectures/123')
    expect(mapToLegacyPath('/learn/resources/9')).toBe('/resources/9')
    expect(mapToLegacyPath('/learn/assignments/55')).toBe('/assignments/55')
  })

  it('falls back to assignment detail for the problem view', () => {
    expect(mapToLegacyPath('/learn/assignments/55/problems/7')).toBe(
      '/assignments/55',
    )
  })

  it('keeps the learn listing and dashboard as-is', () => {
    expect(mapToLegacyPath('/learn')).toBe('/learn')
    expect(mapToLegacyPath('/')).toBe('/')
  })

  it('keeps the existing course translations', () => {
    expect(mapToLegacyPath('/my-courses')).toBe('/my-lectures')
    expect(mapToLegacyPath('/my-courses/12')).toBe('/my-lectures/12')
    expect(mapToLegacyPath('/course/12')).toBe('/new-courses/12')
  })

  it('leaves unrelated paths untouched', () => {
    expect(mapToLegacyPath('/bookmarks')).toBe('/bookmarks')
    expect(mapToLegacyPath('/announcements/4')).toBe('/announcements/4')
  })
})
