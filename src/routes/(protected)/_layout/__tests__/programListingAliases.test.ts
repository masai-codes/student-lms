import { describe, expect, it } from 'vitest'
import { isRedirect } from '@tanstack/react-router'
import { Route as MyCoursesRoute } from '../my-courses'
import { Route as MyLecturesRoute } from '../my-lectures'
import { Route as MyProgramsRoute } from '../my-programs'

/**
 * `/my-programs` is the canonical program listing. `/my-courses` (the working
 * name during the rebuild) and `/my-lectures` (the OLD LMS's path) must forward
 * to it rather than 404 for anyone holding a stale link.
 */
const ALIASES = [
  ['/my-courses', MyCoursesRoute],
  ['/my-lectures', MyLecturesRoute],
] as const

function runLoader(route: (typeof ALIASES)[number][1], search = {}) {
  const loader = route.options.loader
  if (!loader) throw new Error('alias route has no loader')
  // The loader always throws a redirect; capture it.
  try {
    ;(loader as (ctx: unknown) => unknown)({ location: { search } })
  } catch (thrown) {
    return thrown
  }
  throw new Error('alias route did not redirect')
}

describe('program listing route aliases', () => {
  it.each(ALIASES)('%s redirects to /my-programs', (_path, route) => {
    const thrown = runLoader(route)

    expect(isRedirect(thrown)).toBe(true)
    // `replace` keeps the alias out of history, so Back doesn't bounce through it.
    expect(thrown).toMatchObject({
      options: { to: '/my-programs', replace: true },
    })
  })

  it.each(ALIASES)('%s preserves search params', (_path, route) => {
    const thrown = runLoader(route, { ref: 'email' })
    expect(thrown).toMatchObject({ options: { search: { ref: 'email' } } })
  })

  it('serves the listing itself at /my-programs, with no redirect', () => {
    expect(MyProgramsRoute.options.loader).toBeUndefined()
    expect(MyProgramsRoute.options.component).toBeTypeOf('function')
  })
})
