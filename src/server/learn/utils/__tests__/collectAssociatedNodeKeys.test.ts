import { describe, expect, it } from 'vitest'

import type { AssociationGraph } from '../associationGraphTypes'
import { buildAssociationGraph } from '../buildAssociationGraph'
import { collectAssociatedNodeKeys } from '../collectAssociatedNodeKeys'

const graph = buildAssociationGraph({
  lectures: [
    { id: 1, data: { associatedLecture: { id: 2 } } },
    { id: 2, data: { associatedLecture: { id: 3 } } },
    { id: 3, data: null },
    { id: 9, data: null },
  ],
  assignments: [{ id: 7, data: { associatedLecture: [{ id: 2 }] } }],
})

describe('collectAssociatedNodeKeys', () => {
  it('returns the transitive closure excluding the start node', () => {
    expect(collectAssociatedNodeKeys(graph, 'lecture:1').sort()).toEqual([
      'assignment:7',
      'lecture:2',
      'lecture:3',
    ])
  })

  it('resolves associations both ways from a leaf node', () => {
    expect(collectAssociatedNodeKeys(graph, 'lecture:3').sort()).toEqual([
      'assignment:7',
      'lecture:1',
      'lecture:2',
    ])
  })

  it('returns empty for isolated or unknown nodes', () => {
    expect(collectAssociatedNodeKeys(graph, 'lecture:9')).toEqual([])
    expect(collectAssociatedNodeKeys(graph, 'lecture:404')).toEqual([])
  })

  it('skips neighbours that have no adjacency entry', () => {
    const sparse: AssociationGraph = new Map([
      ['lecture:1', new Set(['lecture:2'])],
    ])
    expect(collectAssociatedNodeKeys(sparse, 'lecture:1')).toEqual([
      'lecture:2',
    ])
  })
})
