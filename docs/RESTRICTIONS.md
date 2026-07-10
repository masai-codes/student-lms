# Access Restrictions

student-lms has **four independent restriction states**. All enforcement is
server-side — the frontend only renders what the backend sends. Three states are
**per-batch** (stored in `batch_user.meta` JSON, read-only from this repo); one is
**user-level** (`users.status`).

Reusable logic lives in [`src/server/restrictions/`](../src/server/restrictions/).
"Enrolled batches" everywhere means: `section_user → sections → sections.batch_id`
(via [`getBatchIdsForEnrolledUser`](../src/server/batches/getBatchIdsForEnrolledUser.ts) —
the single source of truth).

| State | Level | Source | Severity |
|-------|-------|--------|----------|
| Deactivated user | user | `users.status === 'disabled'` | Blocks login entirely |
| Enrolment cancelled | batch | `batch_user.meta.batchEnrolmentCancelled` (+ `…Date`) | Batch fully hidden |
| Paused | batch | `batch_user.meta.batchPaused` (+ `batchPausedDate`) | Post-pause content hidden |
| Agreement banned | batch | `batch_user.meta.aggrementBanned` (+ `…Date`) | 2 detail-page blocks only |

Dates are IST wall-clock strings. Date-only values are treated as **end of that day**
(so "after the date" excludes the date itself). Comparison is epoch-based and safe
for both naive and `+05:30` datetime columns.

---

## 1. Deactivated user (`users.status === 'disabled'`)

The account cannot be used at all.

| Surface | Behaviour |
|---------|-----------|
| Send OTP | `sendOtp` throws `ACCOUNT_DEACTIVATED` → **403** |
| Verify OTP | deactivated accounts dropped from the match; if none remain → `ACCOUNT_DEACTIVATED` → **403** |
| Password login | `loginWithPassword` throws `ACCOUNT_DEACTIVATED` → **403** |
| Existing session (mid-session) | `getCurrentSessionUserId` resolves to `null` → every session-gated REST endpoint and layout loader is cut off on the next request; `fetchCurrentUser` returns `null` (frontend redirects to login) |

Message: *"Your account has been deactivated. Please contact support if you think
this is a mistake."*

Key files: `src/server/restrictions/deactivatedUser.ts`,
`src/server/auth/v2/{sendOtp,verifyOtp,loginWithPassword}.ts`,
`src/routes/(auth)/v2/login/{request-otp,verify-otp,index}.ts`,
`src/server/auth/getCurrentSessionUserId.ts`, `src/server/auth/fetchCurrentUser.ts`.

---

## 2. Enrolment cancelled (`batchEnrolmentCancelled`)

The user sees **nothing batch-specific** for that batch — it behaves as if they are
no longer enrolled. Not date-gated.

| Surface | Behaviour |
|---------|-----------|
| Enrolled-batch resolution | Batch removed inside `getBatchIdsForEnrolledUser`, so it disappears from everything downstream automatically |
| Learn — batch selector | Batch absent from the selector (`getEnrolledBatchesForUser`) |
| Learn — listing (lectures/assignments/resources) | Empty result even if the `batchId` is passed directly (`getBatchLearningData` guard) |
| Dashboard — schedule | Rows in cancelled batches dropped (`makePausedScheduleFilter`) |
| Dashboard — pending tasks | Same — dropped |
| Dashboard — batch-start / welcome banners, navbar pill, my-courses | Inherit the exclusion via `getBatchIdsForEnrolledUser` |
| Announcements — feed / unread count / popups | Cancelled batch's sections dropped |
| Onboarding / T0 guided tour | Batch not shown (T0 flow uses the excluded helper) |
| Lecture / assignment / resource **detail** URL | Whole page → *"You can't access this content — your enrolment in this batch has been cancelled."* + **Contact support** → `/support` |

Detail-page direct URLs still resolve to the restriction page (not a 404) because
`ensureUserCanAccessLearnHubEntity` falls back to `section_user` membership.

Restriction kind: `{ kind: 'enrolment-cancelled' }`.

---

## 3. Paused (`batchPaused` + `batchPausedDate`)

Less restrictive than cancelled: content scheduled **before** `batchPausedDate`
stays visible; everything scheduled **after** is hidden.

| Surface | Behaviour |
|---------|-----------|
| Learn — listing | Items scheduled after the pause cutoff are hidden (`getPausedCutoff` → SQL cutoff); earlier items shown |
| Dashboard — schedule | Post-pause rows dropped (`makePausedScheduleFilter`); earlier rows kept |
| Dashboard — pending tasks | Same |
| Announcements — feed / unread count / popups | Announcements scheduled after the pause cutoff excluded (`AND NOT (section_id IN (…) AND schedule > cutoff)`) |
| Detail URL, content **before** pause date | Fully accessible |
| Detail URL, content **after** pause date | Whole page → *"You're not allowed to access this page."* + **Contact support** → `/support` |

Restriction kind: `{ kind: 'paused' }`.

---

## 4. Agreement banned (`aggrementBanned`)

The user can do **everything except two things**, and only on two detail pages.
**No filtering** anywhere — listings, dashboard, and announcements are unaffected.
Not date-gated.

| Surface | Behaviour |
|---------|-----------|
| Lecture detail that would show a **video recording** (`hasRecording === true`) | Whole page → *"Your access is restricted — you haven't signed your agreement."* + **Sign agreement** CTA |
| Live lecture with **no** recording | Unaffected — user can still join the live session |
| **Practice** (proactive) assignment detail (`type === 'practice'`) | Whole page → same "sign agreement" restriction + CTA |
| Non-practice assignments, resources, everything else | Unaffected |

The **Sign agreement** CTA deep-links the onboarding agreement step for that batch:
`/?guidedTour=open&batchId=<id>&tab=program&step=agreement` → preselects the batch +
agreement step in the guided tour.

Restriction kinds: `{ kind: 'agreement-recording', batchId }` /
`{ kind: 'agreement-practice', batchId }`.

---

## Precedence (detail pages)

When multiple batch restrictions apply to the same content, the most severe wins:

```
enrolment-cancelled  >  paused (after cutoff)  >  agreement (recording | practice)
```

Resolved by
[`resolveLearnDetailRestriction`](../src/server/restrictions/resolveLearnDetailRestriction.ts).
The detail payload carries a single `restriction?: LearnDetailRestriction | null`
field; the frontend renders `LearnRestrictionPage` from it.

## What restricts what — at a glance

| Surface | Deactivated | Cancelled | Paused | Agreement |
|---------|:-----------:|:---------:|:------:|:---------:|
| Login / session | ✅ block | — | — | — |
| Learn listing (filter out) | — | ✅ whole batch | ✅ post-pause | — |
| Dashboard schedule / pending | — | ✅ | ✅ post-pause | — |
| Announcements | — | ✅ | ✅ post-pause | — |
| Onboarding / T0 | — | ✅ hidden | — | — (CTA target) |
| Lecture detail (recording) | — | ✅ page | ✅ page (post-pause) | ✅ page + CTA |
| Live lecture (no recording) | — | ✅ page | ✅ page (post-pause) | — |
| Assignment detail (practice) | — | ✅ page | ✅ page (post-pause) | ✅ page + CTA |
| Assignment detail (other) | — | ✅ page | ✅ page (post-pause) | — |
| Resource detail | — | ✅ page | ✅ page (post-pause) | — |
