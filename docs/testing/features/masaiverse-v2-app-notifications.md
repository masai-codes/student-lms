# Masaiverse v2 — App notifications

## Scope

The only app push notifications student-lms is responsible for in Masaiverse v2:

1. **Discussion reply received** — when someone replies to a post, the post author
   gets an app notification.
   - Public (community) discussion → payload carries `postId`.
   - Club discussion → payload carries `clubId` **and** `postId`.
   - `notificationType: discussion-reply-received` in both cases.
2. **Event reminders** — registered users are reminded **1 hour** and **10 minutes**
   before an event starts; payload carries `eventId`.

Delivery (Expo + device tokens) lives entirely in **experience-api**, which shares the
same database. student-lms only *triggers* the discussion-reply notification over an
authenticated server-to-server call. Event reminders are scheduled and sent end-to-end
by experience-api's BullMQ jobs — student-lms does not trigger them.

No other Masaiverse notifications are sent from student-lms (the former post-upvote
notification was removed from both repos).

## Architecture

- `notifyDiscussionReply.service.ts` — resolves the post author + club from `posts`,
  skips self-replies and missing posts, then calls the trigger.
- `triggerExperienceApiCommunityNotify.ts` — `notifyDiscussionReplyViaExperienceApi`
  POSTs to `/internal/community-masaiverse/notify/post-reply` on experience-api
  (`x-community-masaiverse-secret` header, `EXPERIENCE_API_BASE_URL`). Bounded by a
  4s timeout and never throws.
- `createDiscussionReply.service.ts` — calls `notifyDiscussionReply` after awarding
  reply points.

## Tests

- `notifyDiscussionReply.service.test.ts`
  - Club post → trigger called with `clubId` + `discussion-reply-received`.
  - Public post → `clubId: null`.
  - Self-reply → no trigger.
  - Missing post → no trigger.
- `triggerExperienceApiCommunityNotify.test.ts`
  - Missing env (base url / secret) → no call, warns.
  - Configured + club → correct URL, secret header, body with `club_id` and default type.
  - Public post → body omits `club_id`; explicit `notificationType` honored.
  - Non-ok response → warns, resolves (no throw).
  - Transport error → swallowed, resolves.
- `discussionReplies.service.test.ts`
  - `createDiscussionReply` invokes `notifyDiscussionReply` with the trimmed preview.

## Run

```bash
npx vitest run \
  src/server/api/masaiverse-v2/__tests__/notifyDiscussionReply.service.test.ts \
  src/server/masaiverse/__tests__/triggerExperienceApiCommunityNotify.test.ts \
  src/server/api/masaiverse-v2/__tests__/discussionReplies.service.test.ts
```
