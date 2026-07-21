import {
  makeAssociationNodeKey,
  type AssociationGraph,
  type AssociationNodeKey,
} from '@/server/learn/utils/associationGraphTypes'
import { readAssociatedLectureIds } from '@/server/learn/utils/parseLectureDataJson'

type AssociationGraphRow = {
  id: number
  data: unknown
}

/**
 * Builds the undirected association graph for a single section from its lecture
 * and assignment rows. Every stored `associatedLecture` pointer (on a lecture or
 * an assignment) becomes a two-way edge, so callers can later find the transitive
 * closure of any node regardless of which side declared the link.
 *
 * O(V + E) over the section corpus and free of DB access, so it is pure and
 * cheaply testable. Pointers to rows outside the corpus (cross-section, deleted,
 * or dangling ids) are ignored — we never invent phantom nodes.
 */
export function buildAssociationGraph(input: {
  lectures: Array<AssociationGraphRow>
  assignments: Array<AssociationGraphRow>
}): AssociationGraph {
  const graph: AssociationGraph = new Map()

  const ensureNode = (key: AssociationNodeKey): void => {
    if (!graph.has(key)) graph.set(key, new Set())
  }

  for (const lecture of input.lectures) {
    ensureNode(makeAssociationNodeKey('lecture', lecture.id))
  }
  for (const assignment of input.assignments) {
    ensureNode(makeAssociationNodeKey('assignment', assignment.id))
  }

  const addEdge = (from: AssociationNodeKey, to: AssociationNodeKey): void => {
    if (from === to) return
    const fromNeighbours = graph.get(from)
    const toNeighbours = graph.get(to)
    if (!fromNeighbours || !toNeighbours) return
    fromNeighbours.add(to)
    toNeighbours.add(from)
  }

  const linkToLectures = (from: AssociationNodeKey, data: unknown): void => {
    for (const targetId of readAssociatedLectureIds(data)) {
      addEdge(from, makeAssociationNodeKey('lecture', targetId))
    }
  }

  for (const lecture of input.lectures) {
    linkToLectures(makeAssociationNodeKey('lecture', lecture.id), lecture.data)
  }
  for (const assignment of input.assignments) {
    linkToLectures(
      makeAssociationNodeKey('assignment', assignment.id),
      assignment.data,
    )
  }

  return graph
}
