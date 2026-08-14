import { describe, expect, it } from 'vitest'
import { isMigratedRoute } from '@/utils/migratedRoutes'

describe('isMigratedRoute', () => {
  it.each([
    '/',
    '',
    '/learn',
    '/learn/lectures/1',
    '/learn/discussions',
    '/lectures/1',
    '/assignments/1',
    '/resources/1',
    '/announcements',
    '/messages/1',
    '/bookmarks',
    '/whats-new',
    '/chat',
    '/support',
    '/profile-settings',
  ])('treats %s as migrated', (pathname) => {
    expect(isMigratedRoute(pathname)).toBe(true)
  })

  it.each([
    // Zoom web view is served only by the old LMS — must never switch.
    '/lectures/1/zoom',
    '/profile',
    '/my-courses',
    '/masaiverse',
    '/interviews',
    // Support deep-link embedded in the old-LMS iframe: not a hand-off target.
    '/support/context',
  ])('treats %s as not migrated', (pathname) => {
    expect(isMigratedRoute(pathname)).toBe(false)
  })
})
