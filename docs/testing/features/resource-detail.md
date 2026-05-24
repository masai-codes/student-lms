# Resource detail (`/resources/:id`)

## Scope

- Server: reading-type lectures only; `resourceKind` from category (`pre-read`, `notes`, `material`); phase from schedule/concludes; notes/description body.
- Client: `ResourceDetailPage` routes by kind; each kind routes by phase; overview + associated-content CTA/drawer + left main / right discussions (`LectureDiscussionsSection`, same UI as lecture detail).

## Test files

| Area | File |
|------|------|
| Kind normalization | `src/server/learn/utils/__tests__/normalizeResourceKind.test.ts` |
| Payload builder | `src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts` |
| Detail tags (Reading → Resource) | `src/server/learn/utils/__tests__/buildLearnDetailPresentation.test.ts` |
| Phase copy | `src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts` |
| Markdown body rendering | `src/components/shared/markdown-content/__tests__/*` |
| Associated content list + href | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/*` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/normalizeResourceKind.test.ts src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts src/server/learn/utils/__tests__/buildLearnDetailPresentation.test.ts src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts src/components/shared/markdown-content/__tests__
npm run typecheck
```
