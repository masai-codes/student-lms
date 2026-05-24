import { describe, expect, it } from 'vitest'

import { getLearnAssociatedItemHref } from '../getLearnAssociatedItemHref'

describe('getLearnAssociatedItemHref', () => {
  it('maps each associated kind to the learn detail route', () => {
    expect(
      getLearnAssociatedItemHref({
        id: 1,
        kind: 'lecture',
        title: 'L',
        meta: null,
      }),
    ).toBe('/lectures/1')
    expect(
      getLearnAssociatedItemHref({
        id: 2,
        kind: 'assignment',
        title: 'A',
        meta: null,
      }),
    ).toBe('/assignments/2')
    expect(
      getLearnAssociatedItemHref({
        id: 3,
        kind: 'resource',
        title: 'R',
        meta: null,
      }),
    ).toBe('/resources/3')
  })
})
