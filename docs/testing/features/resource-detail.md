# Resource detail (`/resources/:id`)

## Scope

- Server: reading-type lectures only; `resourceKind` from category (`pre-read`, `notes`, `material`); phase from schedule/concludes; notes/description body; per-user `isBookmarked` resolved in the single detail GET.
- Client: `ResourceDetailPage` routes by kind; each kind routes by phase; overview + header actions (Raise Ticket + wired bookmark toggle) + associated-content CTA/drawer + left main / right discussions (`LectureDiscussionsSection`, same UI as lecture detail).
- Bookmark: state arrives in the detail payload; toggle via REST `POST`/`DELETE /api/learn/resources/:id/bookmark` (entity type `App\Models\Lecture`), optimistic with toast + revert on failure. Mirrors legacy `createBookmark`/`deleteBookmark`.

## Test files

| Area                                   | File                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Kind normalization                     | `src/server/learn/utils/__tests__/normalizeResourceKind.test.ts`                                          |
| Payload builder (incl. `isBookmarked`) | `src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts`                                     |
| Detail service (incl. bookmark state)  | `src/server/learn/__tests__/getResourceLearningDetail.service.test.ts`                                    |
| Bookmark service (get/add/remove)      | `src/server/learn/services/__tests__/learnEntityBookmark.service.test.ts`                                 |
| Bookmark toggle handler                | `src/server/api/learn/handlers/__tests__/resourceBookmark.handler.test.ts`                                |
| Bookmark button UI (optimistic toggle) | `src/components/features/learn/LearnPageDetails/resource/shared/__tests__/ResourceDetailActions.test.tsx` |
| Detail tags (Reading → Resource)       | `src/server/learn/utils/__tests__/buildLearnDetailPresentation.test.ts`                                   |
| Phase copy                             | `src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts`      |
| Markdown body rendering                | `src/components/shared/markdown-content/__tests__/*`                                                      |
| Associated content list + href         | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/*`                            |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/normalizeResourceKind.test.ts src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts src/server/learn/utils/__tests__/buildLearnDetailPresentation.test.ts src/server/learn/__tests__/getResourceLearningDetail.service.test.ts src/server/learn/services/__tests__/learnEntityBookmark.service.test.ts src/server/api/learn/handlers/__tests__/resourceBookmark.handler.test.ts src/components/features/learn/LearnPageDetails/resource/shared/__tests__ src/components/shared/markdown-content/__tests__
npm run typecheck
```
