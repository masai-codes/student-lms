// Association is stored in the legacy `data` JSON column (key `associatedLecture`)
// rather than a join table, and only ever points at lecture rows. To resolve the
// full set of associated entities for one entity we treat the section's lectures,
// resources (reading lectures) and assignments as nodes of a single UNDIRECTED
// graph, so a link discovered in either direction — and any transitive chain
// (E1→E2→E3) — is reachable from every node it touches.

// A graph node is either a lecture row (covers both lectures and resources, which
// are lectures with type `reading`) or an assignment row.
export type AssociationNodeKind = 'lecture' | 'assignment'

// Stable, comparable identity for a node, e.g. `lecture:42` / `assignment:7`.
export type AssociationNodeKey = `${AssociationNodeKind}:${number}`

// Adjacency list. Undirected: if A links to B, B also links back to A.
export type AssociationGraph = Map<AssociationNodeKey, Set<AssociationNodeKey>>

export function makeAssociationNodeKey(
  kind: AssociationNodeKind,
  id: number,
): AssociationNodeKey {
  return `${kind}:${id}`
}

export function parseAssociationNodeKey(key: AssociationNodeKey): {
  kind: AssociationNodeKind
  id: number
} {
  const separatorIndex = key.indexOf(':')
  return {
    kind: key.slice(0, separatorIndex) as AssociationNodeKind,
    id: Number(key.slice(separatorIndex + 1)),
  }
}
