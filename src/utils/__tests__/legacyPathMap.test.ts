import { describe, expect, it } from 'vitest'
import { mapToLegacyPath } from '@/utils/legacyPathMap'

describe('mapToLegacyPath', () => {
  it.each([
    ['/learn/discussions', '/discussions'],
    ['/learn/lectures/12', '/lectures/12'],
    ['/learn/resources/12', '/resources/12'],
    ['/learn/assignments/12', '/assignments/12'],
    ['/learn/assignments/12/problems/34', '/assignments/12'],
    ['/my-programs', '/my-lectures'],
    ['/my-programs/12', '/my-lectures/12'],
    // `/my-courses` is the pre-rename alias for `/my-programs`.
    ['/my-courses', '/my-lectures'],
    ['/my-courses/12', '/my-lectures/12'],
    ['/course/12', '/new-courses/12'],
  ])('maps %s → %s', (pathname, expected) => {
    expect(mapToLegacyPath(pathname)).toBe(expected)
  })

  it.each([
    '/',
    '/learn',
    '/support',
    '/chat',
    '/bookmarks',
    '/profile',
    // Already the old LMS's own path for the programs listing.
    '/my-lectures',
  ])(
    'leaves %s untouched (same route on both apps)',
    (pathname) => {
      expect(mapToLegacyPath(pathname)).toBe(pathname)
    },
  )
})
