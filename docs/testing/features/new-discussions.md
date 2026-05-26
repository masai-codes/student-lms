# New discussions (learn hub)

## Scope
- Server: `src/server/new-discussions/**` — learn detail discussion list, create, reply, validation, assignee.
- UI: `src/components/features/new-discussions/**` — panel, modal, summary cards (used from learn assignment/resource/lecture detail pages).
- Legacy course `/discussions/*` routes and `src/components/features/discussions` were removed.

## Automated tests
| Module | File |
|--------|------|
| Presentation mapping | `src/server/new-discussions/utils/__tests__/discussionPresentation.test.ts` |
| Input validation | `src/server/new-discussions/utils/__tests__/validateDiscussionWriteInput.test.ts` |
| Assignee resolution | `src/server/new-discussions/services/__tests__/resolveAssigneeFromSection.test.ts` |

## Commands
```bash
npm run test -- src/server/new-discussions
```
