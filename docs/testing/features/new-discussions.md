# New discussions (learn hub)

## Scope
- Server: `src/server/new-discussions/**` — learn detail discussion list, create, reply, validation, assignee.
- UI: `src/components/features/new-discussions/**` — panel, modal, summary cards (used from learn assignment/resource/lecture detail pages).
- Detail-page discussion list UI: `src/components/features/learn/LearnPageDetails/lecture/discussions/**` — the live `LectureDiscussionsSection` shared by lecture, assignment, and resource detail. Provides search, a "My Discussions" toggle, 10-per-page pagination, and Ongoing/Closed status tags.
- Legacy course `/discussions/*` routes and `src/components/features/discussions` were removed.

## List controls (search / my-discussions / pagination / tags)
- Filtering, search, and pagination run client-side over the discussion list already embedded in the detail payload (no new list endpoint). Search matches the discussion title or message preview (case-insensitive); the toggle keeps discussions whose author is the signed-in user; the list shows `LEARN_DISCUSSION_PAGE_SIZE` (10) per page.
- Status tag mirrors the old LMS: `Ongoing` (open) / `Closed`, derived from `isClosed` on `DiscussionSummaryCard`.
- Analytics: `l_learn_discussion_search`, `l_learn_discussion_mine_toggle`, `l_learn_discussion_page_change` (plus the existing create/reply events).

## Automated tests
| Module | File |
|--------|------|
| Presentation mapping | `src/server/new-discussions/utils/__tests__/discussionPresentation.test.ts` |
| Input validation | `src/server/new-discussions/utils/__tests__/validateDiscussionWriteInput.test.ts` |
| Assignee resolution | `src/server/new-discussions/services/__tests__/resolveAssigneeFromSection.test.ts` |
| Filter/paginate helpers | `.../lecture/discussions/utils/__tests__/filterAndPaginateDiscussions.test.ts` |
| List controls hook | `.../lecture/discussions/hooks/__tests__/useLearnDiscussionListControls.test.ts` |
| List toolbar (search + toggle) | `.../lecture/discussions/__tests__/LectureDiscussionListToolbar.test.tsx` |
| Pagination | `.../lecture/discussions/__tests__/LectureDiscussionPagination.test.tsx` |
| List / empty states | `.../lecture/discussions/__tests__/LectureDiscussionList.test.tsx` |
| Create panel | `.../lecture/discussions/__tests__/LectureDiscussionCreatePanel.test.tsx` |
| Section integration | `.../lecture/discussions/__tests__/LectureDiscussionsSection.test.tsx` |
| Status tags | `src/components/features/new-discussions/__tests__/DiscussionSummaryCard.test.tsx` |

## Commands
```bash
npm run test -- src/server/new-discussions
npm run test -- src/components/features/learn/LearnPageDetails/lecture/discussions
npm run test -- src/components/features/new-discussions
```
