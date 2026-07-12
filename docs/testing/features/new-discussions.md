# New discussions (learn hub)

## Scope
- Server: `src/server/new-discussions/**` — learn detail discussion list, create, reply, validation, assignee.
- UI: `src/components/features/new-discussions/**` — panel, modal, summary cards (used from learn assignment/resource/lecture detail pages).
- Detail-page discussion list UI: `src/components/features/learn/LearnPageDetails/lecture/discussions/**` — the live `LectureDiscussionsSection` shared by lecture, assignment, and resource detail. Provides search, a "My Discussions" toggle, 10-per-page pagination, Ongoing/Closed status tags, unread-reply badges, owner close/reopen, and owner feedback/rating.
- Owner write endpoints: `POST /api/learn/discussions/:id/read` (mark replies read), `POST /api/learn/discussions/:id/close` (`{ isClosed }`), `POST /api/learn/discussions/:id/feedback` (`{ rating, comment? }`). All owner-only (`assertViewerOwnsDiscussion`).
- Legacy course `/discussions/*` routes and `src/components/features/discussions` were removed.

## List controls (search / my-discussions / pagination / tags)
- Filtering, search, and pagination run client-side over the discussion list already embedded in the detail payload (no new list endpoint). Search matches the discussion title or message preview (case-insensitive); the toggle keeps discussions whose author is the signed-in user; the list shows `LEARN_DISCUSSION_PAGE_SIZE` (10) per page.
- Status tag mirrors the old LMS: `Ongoing` (open) / `Closed`, derived from `isClosed` on `DiscussionSummaryCard`.
- Analytics: `l_learn_discussion_search`, `l_learn_discussion_mine_toggle`, `l_learn_discussion_page_change` (plus the existing create/reply events).

## Unread replies / close-resolve / feedback (owner only)
- `DiscussionListItem` gains `unreadReplyCount` (owner-only count of others' unread replies) and `feedbackRating` (1–5, read from `discussions.data.learnFeedback`). List services compute unread from thread `read_at`; `read_at` is stamped when the owner expands a thread with unread replies.
- Close/resolve toggles `discussions.is_closed` (owner only; blocks replies when closed). Feedback merges `{ rating, comment }` into `discussions.data` without a schema change.
- Analytics: `l_learn_discussion_close_toggle_id_<id>`, `l_learn_discussion_feedback_id_<id>`.

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
| List item (mark-read + owner gating) | `.../lecture/discussions/__tests__/LectureDiscussionListItem.test.tsx` |
| Owner actions (close/reopen + feedback) | `.../lecture/discussions/__tests__/LectureDiscussionOwnerActions.test.tsx` |
| Feedback form | `.../lecture/discussions/__tests__/LectureDiscussionFeedbackForm.test.tsx` |
| Status tags + unread badge | `src/components/features/new-discussions/__tests__/DiscussionSummaryCard.test.tsx` |
| Ownership guard | `src/server/new-discussions/services/__tests__/assertViewerOwnsDiscussion.test.ts` |
| Mark replies read | `src/server/new-discussions/services/__tests__/markLearnDiscussionRepliesRead.test.ts` |
| Close / reopen | `src/server/new-discussions/services/__tests__/setLearnDiscussionClosed.test.ts` |
| Submit feedback | `src/server/new-discussions/services/__tests__/submitLearnDiscussionFeedback.test.ts` |
| Feedback validation | `src/server/new-discussions/utils/__tests__/validateDiscussionFeedbackInput.test.ts` |
| Owner write handlers | `src/server/api/learn/handlers/__tests__/{markLearnDiscussionRead,setLearnDiscussionClosed,submitLearnDiscussionFeedback}.handler.test.ts` |
| Client API helpers | `src/lib/api/learn/__tests__/discussionsApi.test.ts` |

## Commands
```bash
npm run test -- src/server/new-discussions
npm run test -- src/components/features/learn/LearnPageDetails/lecture/discussions
npm run test -- src/components/features/new-discussions
npm run test -- src/server/api/learn/handlers src/lib/api/learn
```
