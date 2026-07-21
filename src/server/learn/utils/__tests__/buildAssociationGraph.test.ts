import { describe, expect, it } from 'vitest'

import type {
  AssociationGraph,
  AssociationNodeKey,
} from '../associationGraphTypes'
import { buildAssociationGraph } from '../buildAssociationGraph'

function neighbours(
  graph: AssociationGraph,
  key: AssociationNodeKey,
): Array<string> {
  return [...(graph.get(key) ?? [])].sort()
}

describe('buildAssociationGraph', () => {
  it('creates undirected edges for lecture and assignment pointers', () => {
    const graph = buildAssociationGraph({
      lectures: [
        { id: 1, data: { associatedLecture: { id: 2 } } },
        { id: 2, data: null },
      ],
      assignments: [{ id: 7, data: { associatedLecture: [{ id: 2 }] } }],
    })

    expect(neighbours(graph, 'lecture:1')).toEqual(['lecture:2'])
    expect(neighbours(graph, 'lecture:2')).toEqual([
      'assignment:7',
      'lecture:1',
    ])
    expect(neighbours(graph, 'assignment:7')).toEqual(['lecture:2'])
  })

  it('ignores self references and pointers outside the section corpus', () => {
    const graph = buildAssociationGraph({
      lectures: [
        { id: 1, data: { associatedLecture: { id: 1 } } },
        { id: 2, data: { associatedLecture: { id: 999 } } },
      ],
      assignments: [],
    })

    expect(neighbours(graph, 'lecture:1')).toEqual([])
    expect(neighbours(graph, 'lecture:2')).toEqual([])
    expect(graph.has('lecture:999')).toBe(false)
  })
})
