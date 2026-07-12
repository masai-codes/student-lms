# Associated content (lectures, resources & assignments)

## Scope

- Resolves **all** entities associated with a lecture, resource, or assignment — the full transitive closure across a section, in both directions. If E1 links to E2 and E2 links to E3, then E1, E2 and E3 each surface the other two.
- Backed by the legacy data model unchanged: associations live in the `data` JSON column (`associatedLecture`, a single object or an array) on `lectures` and `assignments`, and only ever point at lecture rows. Resources are lecture rows of type `reading`.
- Algorithm (`src/server/learn/services/getAllAssociatedEntities.service.ts`): read the section's lectures + assignments in exactly **two** queries, build one undirected in-memory graph (`buildAssociationGraph`), then BFS the transitive closure from the start node (`collectAssociatedNodeKeys`). O(V + E); replaces the previous per-linked-lecture re-scan (N+1). Section-less entities (e.g. recommended lectures) fall back to direct forward links only.
- Consumed by the three learn detail services (`getLectureLearningDetail`, `getResourceLearningDetail`, `getAssignmentLearningDetail`) which feed `associatedItems` to the associated-content list/drawer UI.

## Test files

| Area | File |
|------|------|
| Node key make/parse | `src/server/learn/utils/__tests__/associationGraphTypes.test.ts` |
| Undirected graph build (edges, self/dangling ignored) | `src/server/learn/utils/__tests__/buildAssociationGraph.test.ts` |
| BFS transitive closure (both ways, excludes start, isolated/unknown, sparse) | `src/server/learn/utils/__tests__/collectAssociatedNodeKeys.test.ts` |
| Schedule meta formatter (null/blank/populated) | `src/server/learn/utils/__tests__/formatAssociatedMeta.test.ts` |
| Service (lecture/resource/assignment starts, not-in-corpus, section-less fallback) | `src/server/learn/services/__tests__/getAllAssociatedEntities.service.test.ts` |
| JSON pointer parsing (single & array shapes) | `src/server/learn/utils/__tests__/parseLectureDataJson.test.ts` |
| Associated list + href UI | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/*` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/associationGraphTypes.test.ts src/server/learn/utils/__tests__/buildAssociationGraph.test.ts src/server/learn/utils/__tests__/collectAssociatedNodeKeys.test.ts src/server/learn/utils/__tests__/formatAssociatedMeta.test.ts src/server/learn/services/__tests__/getAllAssociatedEntities.service.test.ts
npm run typecheck
```

## Notes / known gaps

- `getLectureLearningDetail.service.test.ts` has a pre-existing failure (unrelated to associations): its `db` mock does not return a chainable object for the `lectureZoomChat` query. This is not introduced or fixed here.
- Section-less entities intentionally return only their direct forward links (no reverse/transitive), since the association corpus is section-scoped in the legacy data model.
