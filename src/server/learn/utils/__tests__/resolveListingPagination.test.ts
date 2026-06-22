import { describe, expect, it } from 'vitest'

import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

describe('resolveListingPagination', () => {
  it('returns a single empty page when there are no items', () => {
    expect(resolveListingPagination(0, 1, 25)).toEqual({
      page: 1,
      pageSize: 25,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })
  })

  it('reports next page availability on the first of several pages', () => {
    expect(resolveListingPagination(50, 1, 25)).toMatchObject({
      page: 1,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    })
  })

  it('reports previous page availability on the last page', () => {
    expect(resolveListingPagination(50, 2, 25)).toMatchObject({
      page: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    })
  })

  it('clamps an out-of-range page down to the last page', () => {
    expect(resolveListingPagination(50, 9, 25).page).toBe(2)
  })

  it('clamps a non-positive page up to the first page', () => {
    expect(resolveListingPagination(50, 0, 25).page).toBe(1)
  })
})
