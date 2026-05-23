# Resource detail (`/resources/:id`)

## Scope

- Server: reading-type lectures only; `resourceKind` from category (`pre-read`, `notes`, `material`); phase from schedule/concludes; notes/description body.
- Client: `ResourceDetailPage` routes by kind; each kind routes by phase; overview + left main / right discussions layout (legacy reading flow).

## Test files

| Area | File |
|------|------|
| Kind normalization | `src/server/learn/utils/__tests__/normalizeResourceKind.test.ts` |
| Payload builder | `src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts` |
| Phase copy | `src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/normalizeResourceKind.test.ts src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts
npm run typecheck
```
