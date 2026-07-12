# Associated content (lectures, resources & assignments)

## Scope

- Resolves **all** entities associated with a lecture, resource, or assignment — the full transitive closure across a section, in both directions. If E1 links to E2 and E2 links to E3, then E1, E2 and E3 each surface the other two.
- Backed by the legacy data model unchanged: associations live in the `data` JSON column (`associatedLecture`, a single object or an array) on `lectures` and `assignments`, and only ever point at lecture rows. Resources are lecture rows of type `reading`.
- Algorithm (`src/server/learn/services/getAllAssociatedEntities.service.ts`): read the section's lectures + assignments once, build one undirected in-memory graph (`buildAssociationGraph`), BFS the transitive closure from the start node (`collectAssociatedNodeKeys`), then enrich only the reachable rows with a single attendance batch (lectures) + submission batch (assignments). O(V + E); replaces the previous per-linked-lecture re-scan (N+1). Section-less entities (e.g. recommended lectures) fall back to direct forward links only.
- **Renders the exact `/learn` listing card.** The service returns full `LearningItem` DTOs (built via the shared `buildAssociatedLearningItems` → `buildLearnListingCardCtas` + `mapLearningEntityRow`, the same builders `/learn` uses), so tags, priority, host, date, join-live, attendance, deadline/status chips and score all match the listing. The client maps `LearningItem → LearnContentItem` via the shared `mapLearningItemToContent` (reused by `LearnLayout` too) and renders `LearnContentCard` (with `isAssociatedCard` → analytics `source: 'associated'`), grouped into Lectures / Resources / Assignments sections. Navigation uses the card's native `<Link>`.
- Consumed by the three learn detail services (`getLectureLearningDetail`, `getResourceLearningDetail`, `getAssignmentLearningDetail`) which feed `associatedItems: LearningItem[]` to `AssociatedContentList` (lecture inline "Associated" tab; resource/assignment drawer via `AssociatedContentEntryCta`).

## Test files

| Area | File |
|------|------|
| Node key make/parse | `src/server/learn/utils/__tests__/associationGraphTypes.test.ts` |
| Undirected graph build (edges, self/dangling ignored) | `src/server/learn/utils/__tests__/buildAssociationGraph.test.ts` |
| BFS transitive closure (both ways, excludes start, isolated/unknown, sparse) | `src/server/learn/utils/__tests__/collectAssociatedNodeKeys.test.ts` |
| Card-item builders (lecture/resource/assignment, attendance/score) | `src/server/learn/utils/__tests__/buildAssociatedLearningItems.test.ts` |
| Service (full-item transitive closure, all start kinds, not-in-corpus, section-less fallback) | `src/server/learn/services/__tests__/getAllAssociatedEntities.service.test.ts` |
| JSON pointer parsing (single & array shapes) | `src/server/learn/utils/__tests__/parseLectureDataJson.test.ts` |
| `LearningItem → LearnContentItem` mapper (shared with /learn) | `src/components/features/learn/shared/__tests__/mapLearningItemToContent.test.ts` |
| Associated list renders grouped `/learn` cards | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/AssociatedContentList.test.tsx` |
| Card analytics `source: 'associated'` | `src/components/features/learn/section-three/content-card/__tests__/LearnContentCard.test.tsx` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/associationGraphTypes.test.ts src/server/learn/utils/__tests__/buildAssociationGraph.test.ts src/server/learn/utils/__tests__/collectAssociatedNodeKeys.test.ts src/server/learn/utils/__tests__/buildAssociatedLearningItems.test.ts src/server/learn/services/__tests__/getAllAssociatedEntities.service.test.ts src/components/features/learn/shared/__tests__/mapLearningItemToContent.test.ts src/components/features/learn/LearnPageDetails/common/associated/__tests__/AssociatedContentList.test.tsx src/components/features/learn/section-three/content-card/__tests__/LearnContentCard.test.tsx
npm run typecheck
```

## Notes / known gaps

- `getLectureLearningDetail.service.test.ts` has a pre-existing failure (unrelated to associations): its `db` mock does not return a chainable object for the `lectureZoomChat` query. This is not introduced or fixed here.
- Section-less entities intentionally return only their direct forward links (no reverse/transitive), since the association corpus is section-scoped in the legacy data model.
- The old lightweight list (`LearnAssociatedListItem`, `getLearnAssociatedItemHref`, `dedupeLearnAssociatedItems`, `formatAssociatedMeta`, `resolveLearnAssociatedKind`) was removed when the surface switched to the full `/learn` card.
