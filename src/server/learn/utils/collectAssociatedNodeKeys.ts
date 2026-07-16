import type {
  AssociationGraph,
  AssociationNodeKey,
} from '@/server/learn/utils/associationGraphTypes'

/**
 * Breadth-first traversal of the undirected association graph. Returns every node
 * reachable from `start` — i.e. the transitive closure (E1→E2→E3 yields E2 and
 * E3) in both directions — excluding `start` itself.
 *
 * O(V + E): a `visited` set guarantees each node is enqueued once, and the
 * `for...of` iterator keeps visiting nodes appended to `queue` during traversal
 * (avoiding the O(n) cost of `Array.shift`). Returns an empty array when the
 * start node is absent from the graph.
 */
export function collectAssociatedNodeKeys(
  graph: AssociationGraph,
  start: AssociationNodeKey,
): Array<AssociationNodeKey> {
  if (!graph.has(start)) return []

  const visited = new Set<AssociationNodeKey>([start])
  const queue: Array<AssociationNodeKey> = [start]

  for (const current of queue) {
    const neighbours = graph.get(current)
    if (!neighbours) continue
    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) continue
      visited.add(neighbour)
      queue.push(neighbour)
    }
  }

  visited.delete(start)
  return [...visited]
}
