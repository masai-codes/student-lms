import { describe, expect, it } from 'vitest'

import { dedupeLearnAssociatedItems } from '../dedupeLearnAssociatedItems'

describe('dedupeLearnAssociatedItems', () => {
  it('removes duplicate kind-id pairs and optional exclude', () => {
    const items = [
      { id: 1, kind: 'lecture' as const, title: 'A', meta: null },
      { id: 1, kind: 'lecture' as const, title: 'A duplicate', meta: null },
      { id: 2, kind: 'assignment' as const, title: 'B', meta: null },
    ]

    expect(dedupeLearnAssociatedItems(items)).toHaveLength(2)
    expect(
      dedupeLearnAssociatedItems(items, { kind: 'assignment', id: 2 }),
    ).toHaveLength(1)
  })
})
