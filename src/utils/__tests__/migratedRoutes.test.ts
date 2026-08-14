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
    // Programs listing plus its two redirecting aliases — all three must be
    // migrated or the layout bounces an opted-in student out before the alias
    // route can run.
    '/my-programs',
    '/my-courses',
    '/my-lectures',
    '/profile',
    // Mobile "More" hub; same path on both apps.
    '/profile-settings',
  ])('treats %s as migrated', (pathname) => {
    expect(isMigratedRoute(pathname)).toBe(true)
  })

  it.each([
    // Zoom web view is served only by the old LMS — must never switch.
    '/lectures/1/zoom',
    // Only the BARE programs listing is migrated: the batch detail is
    // `/course/:id` here, which the old LMS hands off differently.
    '/my-programs/12',
    '/masaiverse',
    '/interviews',
    // Support deep-link embedded in the old-LMS iframe: not a hand-off target.
    '/support/context',
  ])('treats %s as not migrated', (pathname) => {
    expect(isMigratedRoute(pathname)).toBe(false)
  })
})
