# T0 Flow ("New User Journey") — Complete Developer Guide

> **What this is:** The exhaustive, end-to-end reference for the **T0 flow** as implemented
> across `experience-api` (backend) and `experience-ui` (admin + student frontend). It covers
> what T0 is, how a student enters and progresses through it, the data model, every backend
> system that branches on it, every cron/webhook/IVR side-effect, and exactly what a T0 student
> sees on screen (with copy, colors, and conditions). Line numbers are accurate as of the
> `feat/nitansh/learn-improvement` branch and may drift.

---

## Table of contents
1. [TL;DR](#1-tldr)
2. [Core data model — `user_batch_admission_data`](#2-core-data-model)
3. [Entry & progression (the lifecycle)](#3-entry--progression)
4. [Backend GraphQL surface & resolvers](#4-backend-graphql-surface--resolvers)
5. [Payment banner state machine](#5-payment-banner-state-machine)
6. [Guided tour / onboarding progress (backend)](#6-guided-tour--onboarding-progress-backend)
7. [Plivo IVR onboarding calls](#7-plivo-ivr-onboarding-calls)
8. [Onboarding reminder cron (email + push)](#8-onboarding-reminder-cron)
9. [Student kit](#9-student-kit)
10. [Callback tickets + Slack routing](#10-callback-tickets--slack-routing)
11. [Frontend: what the student sees](#11-frontend-what-the-student-sees)
12. [Admin configuration](#12-admin-configuration)
13. [Access control reality check](#13-access-control-reality-check)
14. [End-to-end sequence](#14-end-to-end-sequence)
15. [Environment variables](#15-environment-variables)
16. [Quick file reference](#16-quick-file-reference)
17. [Gotchas](#17-gotchas)

---

## 1. TL;DR

- **"T0 flow"** is the team nickname for the **new-student onboarding journey**. In code it is
  **`new_user_journey`** / **`is_new_user_journey`**.
- A student is "in T0" **iff they have a row in the `user_batch_admission_data` table.**
  `is_new_user_journey` is literally `!!(row exists)`.
- The row is created when the **external admissions system** (internally **"Onwards" / ISI Hub**)
  calls **`POST /auth/register-and-login`** with **`new_user_journey: true`**.
  - ⚠️ It is **not** a literal `onward` API that creates the row (the original hypothesis).
    "Onward/Onwards" is the upstream admissions platform; the separate `/batches/import-students`
    "onward batch" feature is about progressing students to a next program and is unrelated to T0.
- T0 students split by **`feeStatus`**:
  - **`FULL_FEES`** — full course fee paid (also the default when there is *no* admission row).
  - **`PARTIAL_FEES`** — only the seat-blocking / "4K" fee paid; full fee pending.
- The flow drives, in order: a **welcome modal** → a **guided tour** (LMS walkthrough always;
  program overview only after full fee) → **onboarding progress banner/card** → **payment
  countdown banners** (partial-fee only) → **legal-agreement gating** → **student-kit tracking**
  → **ID card reveal**. Behind the scenes it triggers **Plivo IVR calls**, a daily **reminder
  cron** (email + push), and **callback tickets** routed to OPS/NBFC over **Slack**.

---

## 2. Core data model

**`experience-api/prisma/schema.prisma`** → model `user_batch_admission_data` (~line 4678).
**Migration:** `prisma/migrations/20260307183321_add_user_batch_admission_data_and_user_callback_tickets_tables/migration.sql`

One row per **`(user_id, batch_id)`** (composite unique key `user_id_batch_id`).

| Field | Meaning |
|---|---|
| `id`, `user_id`, `batch_id` | PK + composite unique key. |
| `id_card_url` | Student ID card image (shown at end of guided tour). |
| `seat_blocking_fees_paid` / `_amount` / `_paid_date` / `_invoice` | Partial / seat-blocking ("4K") fee info, captured at admission. |
| `full_fees_paid` / `_amount` / `_paid_date` / `_invoice` | Full course fee — **set via the `/webhook/full-fee-payment` webhook**. Drives `feeStatus`. |
| `student_kit_exists`, `student_kit_details_filled`, `student_kit_tracking_url` | Student-kit shipment tracking. |
| `course_fee_deadline` | Deadline for payment-countdown banners. **Required** when `new_user_journey: true`. |
| `lms_access_date` | When LMS access was granted (set to "now" in IST at row creation). Anchor for all banner timers. |
| `payment_url` | Where the student pays the remaining full fee. |
| `meta` (JSON) | Onboarding progress + call idempotency. Keys: `lms_walkthrough`, `program_onboarding` (and `_web`/`_app` variants) as `"X/Y"` fractions; `partial_onboarding_call_triggered_at`, `full_onboarding_call_triggered_at` (ISO timestamps). |
| `created_at`, `updated_at` | Timestamps. |

**Everywhere it's touched** (read/write): `apollo/server.ts` (create + webhook update),
`features/user/resolver.ts` (4 resolvers), `features/user/user.controller.ts` (`/me`),
`features/userCallbackTickets/resolver.ts`, `features/videoAttendance/guidedTourStep.service.ts`,
`features/user/studentKit.service.ts`, `features/plivo/{plivo.service.ts,resolver.ts}`,
`services/onboardingReminder.service.ts`, `services/callbackTicketNbfcOpsSlack.service.ts`.

---

## 3. Entry & progression

### 3.1 Entry — SSO registration
**`apollo/server.ts` → `POST /auth/register-and-login` (~line 1808)**

1. Upstream "Onwards" calls it, authenticated via `x-api-key` header == `ADMISSIONS_API_KEY`
   (401 otherwise, ~line 1823).
2. Payload: `name, email, password, mobile, username` (all mandatory), `batch_id` (mandatory),
   plus T0 fields: `new_user_journey, id_card_url, seat_blocking_fees_*, student_kit_exists,
   course_fee_deadline, payment_url, isiHub`.
3. If `new_user_journey === true`, **`course_fee_deadline` is mandatory** (~line 1913).
4. Inside a DB transaction: create/find user, enroll sections, optionally add to agreement
   section, then **create the admission row only if one doesn't already exist** for that
   `(user_id, batch_id)` (~line 2310–2364):
   - `lms_access_date = now + 5.5h` (IST).
   - `full_fees_paid` defaults `false` → starts in **PARTIAL_FEES**.
   - `meta` starts empty.
5. **Side effects after the transaction:**
   - If `seat_blocking_fees_paid === true` → fire **`PARTIAL_PAYMENT`** Plivo call
     (fire-and-forget, ~line 2422).
   - If brand-new user and `isiHub !== true` → send Masai welcome email (~line 2433).

> The instant this row exists, `is_new_user_journey` is `true` for that user.

### 3.2 Progression — full-fee payment webhook
**`apollo/server.ts` → `POST /webhook/full-fee-payment` (~line 2462)** (auth: `ADMISSIONS_API_KEY`)

Finds the admission row by a **3-tier lookup**:
- **Tier 1:** `lms_admission_user_data_id` → `findUnique({ id })`.
- **Tier 2:** `lms_user_id` → `findFirst({ user_id }, orderBy created_at desc)` (latest row).
- **Tier 3 (legacy):** `username` + `batch_id` → resolve user, then `findUnique(user_id_batch_id)`.

Then:
- Sets `full_fees_paid=true`, `full_fees_paid_date/amount/invoice` (~line 2644).
- **Idempotent:** if already paid, returns 200 without re-updating — but still (re)triggers the call.
- Fires **`FULL_PAYMENT`** Plivo call (`triggerOnboardingCallForUserBatch`).

After this, `feeStatus` flips `PARTIAL_FEES → FULL_FEES`, unlocking program-overview onboarding,
the student-kit tab, and legal agreements.

---

## 4. Backend GraphQL surface & resolvers

**TypeDefs:** `features/user/typeDef.graphql`. **Resolvers:** `features/user/resolver.ts`.

```graphql
enum FeePaymentStatus { PARTIAL_FEES  FULL_FEES }
enum PartialFeesBannerType { TIMER_BANNER  WARNING_BANNER  PAYMENT_BANNER }

type PartialFeesBannerInfo {
  bannerType: PartialFeesBannerType!
  daysRemaining: Int!
  courseFeeDeadline: DateTime!
  lmsAccessDate: DateTime!
  paymentUrl: String
}

type User {
  showWelcomeModal: Boolean          # meta.showWelcomeModal !== true  (resolver.ts:198)
  is_new_user_journey: Boolean       # !!(admission row exists)        (resolver.ts:202)
  feeStatus: FeePaymentStatus        # latest row → full_fees_paid?FULL:PARTIAL; none→FULL (230)
  partialFeesBannerInfo: PartialFeesBannerInfo   # banner state machine (278)
  idCardUrl: String                  # latest row id_card_url           (260)
}
```

Also on `UserCallbackTicket`: `fee_payment_label` ("Full fee paid" / "4k paid" / "—") and
`default_team_label` (OPS vs NBFC). Guided tour exposes `getGuidedTourProgress` (see §6).

REST mirror: `user.controller.ts` `/users/me` returns `is_new_user_journey` + student-kit tracking.

---

## 5. Payment banner state machine

`partialFeesBannerInfo` resolver (`features/user/resolver.ts:278–379`), driven by
`lms_access_date`, `course_fee_deadline`, `full_fees_paid`:

| Condition | Result |
|---|---|
| `full_fees_paid && payment_url` present | **`PAYMENT_BANNER`**, `daysRemaining: 0` (optional extra payment). |
| `full_fees_paid && !payment_url` | `null` (no banner). |
| `!full_fees_paid`, within `min(lms_access_date+14d, course_fee_deadline)` | **`TIMER_BANNER`** with day countdown. |
| `!full_fees_paid`, in the **7 days after** the timer window | **`WARNING_BANNER`** (escalation). |
| `!full_fees_paid`, after that | `null` — comment says *"user should be banned"* but **no actual block is enforced** (see §13). |

So the partial-fee timeline is **~14 days timer → 7 days warning → nothing** (≈21 days total,
possibly shorter if `course_fee_deadline` is earlier).

---

## 6. Guided tour / onboarding progress (backend)

**`features/videoAttendance/guidedTourStep.service.ts`** + `routes/guidedTour.ts` + GraphQL in
`features/videoAttendance/typeDef.graphql`.

### Sections → meta keys
```
lms-walkthrough-web  ┐
lms-walkthrough-app  ┘→ meta.lms_walkthrough
program-onboarding-web ┐
program-onboarding-app ┘→ meta.program_onboarding
```
Progress is stored as `"X/Y"` fractions, per-platform (`lms_walkthrough_web`, `_app`) **and** an
aggregate key holding `max(web, app)`. The frontend reads only the aggregate.

### How progress is computed (`recordGuidedTourStepCompleted`)
- **Auto mode** (caller passes `lectureId`): counts unique lectures in the section + watched
  `video_attendances` (≥10% watch), plus **extra steps**:
  - **LMS walkthrough:** `+3` denominator (profile photo, Zoom auth, app download); `+1` numerator
    if the user has a profile photo. (`LMS_WALKTHROUGH_EXTRA_STEPS = 3`)
  - **Program onboarding:** `+1` step if a legal agreement exists; `+1` numerator if accepted.
- **Explicit mode** (caller passes `completedSteps`/`totalSteps`): used as-is.
- **Sibling sync:** completing a lecture on web also marks the matching app lecture (matched by
  normalized title) complete, and vice-versa.
- **Fee gate:** writing `program_onboarding` is a **silent no-op unless `full_fees_paid === true`**.

### Read path (`getGuidedTourProgressMeta`)
Reads the **primary batch** (highest `batch_id`). Returns `program_onboarding: null` unless
`full_fees_paid`. Completion rule (`onboardingProgress.utils.ts`):
`isOnboardingTrackedCompleteInMeta` = LMS walkthrough complete **AND** (program onboarding complete
*if* full fees, else ignored).

### API
- **GraphQL Query** `getGuidedTourProgress` → `{ lms_walkthrough, program_onboarding, hasDownloadedApp }`.
- **GraphQL Mutation** `recordGuidedTourStepCompleted(input)` → `{ success, meta }`. Input:
  `lectureId?, sectionType!, platform!, watchedSeconds!, totalStepsInSection?, completedSteps?, totalSteps?`.
- **REST:** `GET /api/guided-tour/progress`, `GET /api/guided-tour/sections?sectionTypes=…`,
  `POST /api/guided-tour/step-completed`.

`showWelcomeModal` (User resolver) = `meta.showWelcomeModal !== true`; dismissal is persisted by
`recordWelcomeModalShown` setting `users.meta.showWelcomeModal = true`.

---

## 7. Plivo IVR onboarding calls

**`features/plivo/plivo.service.ts`** — `triggerOnboardingCallForUserBatch(userId, batchId, flowType)`.

Two flows; the **only** difference at the API layer is the URL, the idempotency key, and one field name:

| | `PARTIAL_PAYMENT` | `FULL_PAYMENT` |
|---|---|---|
| Trigger | `register-and-login` when `seat_blocking_fees_paid===true` (server.ts:2422) | `/webhook/full-fee-payment` after marking paid (server.ts:2628/2659) |
| URL env | `PLIVO_AGENTFLOW_URL_PARTIAL` | `PLIVO_AGENTFLOW_URL_FULL` |
| Idempotency meta key | `partial_onboarding_call_triggered_at` | `full_onboarding_call_triggered_at` |
| Identity field sent | `institute_name` | `institution_name` |

**Guards (in order):** user exists → batch exists → admission row exists → idempotency key not
already set (else skip) → `user.mobile` non-empty (else skip gracefully).

**Payload:** `phone_number, student_name (or 'Student'), course_name (batch.meta.courseTitle ??
batch.name), agent_name (DEFAULT_AGENT_NAME), institute/institution_name (batch.meta.instituteName
?? 'Masai School'), full_fee_payment_deadline (course_fee_deadline as YYYY-MM-DD), lms_access
(now >= lms_access_date), call_type`. POSTed with `Authorization: Basic PLIVO_AUTH_BASE64`.

**Idempotency write:** after the attempt — **success or failure** — `meta[key] = now.toISOString()`
is written, so a failed call is **never auto-retried**.

**Inbound webhook:** `POST /plivo/webhook/conversation-end` (`features/plivo/webhook.service.ts`)
normalizes Plivo HANGUP/RECORDING events and upserts an `onboarding_call_summaries` row
(`call_outcome`, `call_status`, `recording_url`, `conversation_summary`, `transcription`,
`admin_status`), resolving `user_id` by phone/name when absent.

---

## 8. Onboarding reminder cron

**`services/onboardingReminder.service.ts`**, scheduled in `utils/queue.ts` (BullMQ).

- **Schedule:** `'30 12 * * *'` = **12:30 UTC = 6:00 PM IST, daily** (`queue.ts:1896–1916`).
- **Selection:** all admission rows with non-null `meta`, deduped to the **highest `batch_id`**
  per user; kept if `lms_walkthrough` incomplete **OR** (`full_fees_paid` and `program_onboarding`
  incomplete). User must be `status='active'` with a valid email.
- **Email** (AWS SES, from `noreply-lms@masaischool.com`): subject `"Complete Your Onboarding |
  {batch}"`, body lists the remaining steps with a CTA to the LMS. Portal-aware (masai / ihub).
- **Push** (Expo): title `"Complete your onboarding"`, body `"Complete your onboarding – {steps}"`,
  `notification_type='onboarding_reminder'`, `entity_id = YYYYMMDD` (dedupes to one/user/day).
  Logged in `notification_logs`.
- Sent in batches of 10 with 500ms gaps; job retries 3× with backoff.

This is the **only scheduled job** that targets T0 students specifically.

---

## 9. Student kit

**`features/user/studentKit.service.ts`** → GraphQL `getStudentKitTracking` (no args) returning
`CourierTrackingInfo`. Four states from the admission row:

1. **NOT_ELIGIBLE** — no row, or `student_kit_exists=false`.
2. **FORM_NOT_FILLED** — `student_kit_exists=true`, `student_kit_details_filled=false`
   (UI sends the student to the admissions SSO form to enter shipping details).
3. **FORM_FILLED_PENDING_TRACKING** — details filled but no `student_kit_tracking_url` yet.
4. **TRACKING_AVAILABLE** — has tracking URL. (Tracking id / courier / status are currently
   **hardcoded** — `CK540196281IN` / "India Post" / "In Transit" — pending real integration.)

Details are filled **externally** (no LMS mutation); `buildAdmissionsSsoUrl()` mints a JWT
(`ADMISSIONS_SSO_SECRET`) → `https://admissions.masaischool.com/lms-login?token=…&redirect={payment_url}`.
No cron.

---

## 10. Callback tickets + Slack routing

**`features/userCallbackTickets/`** (resolver, typeDefs, controller) +
`services/callbackTicketNbfcOpsSlack.service.ts`. Table `user_callback_tickets`
(`prisma/schema.prisma:~3004`), status `pending` ↔ `resolved`.

- **Create** (`createUserCallbackTicket` mutation / `POST /callback-tickets`): requires
  `batch_id` + `category`, optional `preferedtimeslot`/`meta`. Rejects a second **pending** ticket
  for the same user+batch ("Already a request is raised, we will connect with you within 48 hrs.").
- **Team routing** from the admission row: `full_fees_paid` → **OPS**; `seat_blocking_fees_paid &&
  !full_fees_paid` → **NBFC**. Team rows come from the `menus` table (`call-backrequest-team`).
- **Slack** (channel `CALLBACK_NBFC_OPS_SLACK_CHANNEL_ID`, default `C0ANE1ZLD0W`): posts name,
  email, mobile, batch, category, requested time, slot, and the admin link, then @-mentions —
  **OPS subteams** for full-fee, or **three NBFC individuals** for 4K (all overridable via env).
- **Admin** lists/updates via `adminCallbackTickets` / `updateAdminCallbackTicket`; auto-assigns
  on first update; appends an audit trail to `logs`. No cron.

---

## 11. Frontend: what the student sees

Entry orchestration lives in **`apps/student-experience/src/pages/newDashboard/index.tsx`**.
`me` query supplies `is_new_user_journey`, `showWelcomeModal`, `feeStatus`,
`partialFeesBannerInfo`, `idCardUrl`.

### 11.1 Welcome modal (`components/NewDashboard/WelcomeModal.tsx`)
- **Shows when** `showWelcomeModal === true && is_new_user_journey === true`.
- Title **"Welcome to Masai!"**, body *"Your registration is confirmed and your LMS access is now
  active. Let's take a quick walkthrough…"*, an embedded intro video, and 5s Lottie confetti.
- **"Get Started"** (purple `#6962AC`) → switches guided tour to the `walkthrough` tab, loads the
  first video, closes. The **X** calls `recordWelcomeModalShown` (persists dismissal). Either way
  the guided tour then auto-opens.

### 11.2 Guided tour (`context/GuidedTourContext.tsx`, `components/GuidedTour/*`)
- Entry points: navbar **"Guided Tour"** (Question icon, only for new-journey users),
  auto-open on dashboard mount (once per mount, unless dismissed via sessionStorage key, or
  re-open on tab refocus), and deep links (`?guidedTourPlayer=1&guidedTourTab=…&guidedTourStep=…`).
- **Right modal** header *"Let's get you started"*, two tabs (**LMS Walkthrough**, **Program
  Onboarding**), green progress bar, step list (checkmark / spinner / play icons).
- **`showOverviewTab = isNewUserJourney && feeStatus === 'FULL_FEES'`**. When **locked** (partial
  fee), the Program Onboarding tab is greyed with a lock + tooltip *"Complete your program fee
  payment to unlock this section"* and a locked content panel *"Program Onboarding is locked…"*.
- **Video player** plays at 1.25×; reaching **10s** fires `recordGuidedTourStepCompleted`; reaching
  end (~90%) stores full attendance and auto-advances. Non-video steps: **Profile Photo**, **Zoom
  Authentication** ("Connect Zoom to Join Classes"), **Document Upload**, **Student Kit**.
- After all overview steps complete → **ID card** is revealed (image + "Download ID Card", or a
  *"generated within 30 minutes"* pending message).

### 11.3 Onboarding progress banner & card
Both render only when `isNewUserJourney && !loading && !onboardingComplete`.
- **Banner** (`OnboardingProgressBanner.tsx`): floating bottom bar (desktop) / inline (mobile),
  light-blue `#D9E7F7`. Message *"Complete LMS Walkthrough"* → *"Complete program onboarding"* →
  generic; badge shows e.g. **"2 of 3 done"**. Click opens the guided tour on the right tab.
- **Card** (`OnboardingProgressCard.tsx`): right-sidebar (desktop), title *"Complete your
  Onboarding"*, subtitle *"Next step: {LMS Walkthrough | Document Upload | Onboarding}"*.
- Partial-fee students only see the **LMS-walkthrough** portion (program onboarding doesn't apply).

### 11.4 Payment banners (`newDashboard/index.tsx`, partial-fee only)
Backend types map to two UI states:
- **`TIMER_BANNER`/`PAYMENT_BANNER` → "trial"** (orange `#FFF5EE`/`#E76E4B`): *" program
  program fee to avoid interruption and unlock full access."*
- **`WARNING_BANNER` → "overdue"** (red `#FDF4F6`/`#DC3545`, warning icon): *"Payment Overdue!
  Complete the payment to avoid course deactivation."*
- Pulsing badge: *"{n} days remaining"* (or *"Complete payment"* at 0). CTA **"Unlock Full Access"**
  (purple `#5B478B`) opens `payment_url` in a new tab; disabled if no `payment_url`.

### 11.5 Legal agreements (`components/Dashboard/Common/Layout/index.tsx`, `LegalAggrementModal/`)
- `shouldHideAgreementForUnpaidFees = isNewUserJourney && feeStatus !== 'FULL_FEES'` → for T0
  **partial-fee** students the legal modal is **force-hidden until full fee is paid**.
- Documents: **Program Agreement**, **Grading Policy**, **POSH Compliance** (plus any dynamic
  agreements), multi-step accept → `createUserLegalAgreementPDF`.
- **Hard block:** if any section's modal is non-closable (e.g. 7-day window elapsed) and unaccepted,
  the app **redirects to `/support`**. `window.reopenLegalAgreement()` re-opens it from the tickets page.

### 11.6 Profile & tickets
- **Profile** (`profile/NewProfileMain.tsx`): a **"Student Kit"** tab appears for T0 **full-fee**
  users; a **"My Invoices"** tab for any T0 user. (`idCardUrl` is fetched but only rendered in the
  guided tour, not profile.)
- **Tickets** (`tickets/BatchTickets.tsx`): a **"Request a Callback"** button shows for T0 users;
  modal flow = reason → timeslot → success (*"Our team will reach out within 48 hours…"*).
  Partial-fee students don't see the **"Student-Kit"** reason. Calls `createUserCallbackTicket`.

### 11.7 Behavior matrix

| Feature | T0 Full Fee | T0 Partial Fee | Non-T0 (no row) |
|---|---|---|---|
| Welcome modal | ✅ | ✅ | ❌ |
| Guided tour — LMS walkthrough | ✅ | ✅ | ❌ |
| Guided tour — Program overview tab | ✅ unlocked | 🔒 locked | ❌ |
| Onboarding banner/card | ✅ (both tracks) | ✅ (walkthrough only) | ❌ |
| Payment banner | only `PAYMENT_BANNER` if `payment_url` | ✅ `TIMER`→`WARNING` | ❌ |
| Legal agreement modal | ✅ shown | 🚫 hidden until paid | ✅ normal |
| ID card reveal | ✅ (after overview done) | ❌ | ❌ |
| Student Kit profile tab | ✅ | ❌ | ❌ |
| My Invoices profile tab | ✅ | ✅ | ❌ |
| Request-a-Callback | ✅ (incl. Student-Kit reason) | ✅ (no Student-Kit reason) | ❌ |
| Plivo call | `FULL_PAYMENT` | `PARTIAL_PAYMENT` | ❌ |
| Reminder email/push | ✅ | ✅ (walkthrough only) | ❌ |

---

## 12. Admin configuration

`apps/admin/components/Batches/{Create,Edit,SingleBatch}.tsx`:
- **Create/Edit** store program presentation + onward data in `batch.meta`: `courseTitle`,
  `courseDetails[]`, `courseImage`, `courseLogo`, `courseTimeline[]`, `courseStructure[]`,
  `duration`, and the selected **onward batch** data. (`courseTitle`/`instituteName` here feed the
  Plivo call payload.) `curriculumnSupport` and `attendanceRules/Details` go in `batch.settings`.
- **SingleBatch → "Import Students"** (`ImportStudents`, shown only if `batch.meta` set): imports
  from `onward_batch_id` into the current batch with an `import_prefix`. This is the **onward
  progression** feature — separate from T0 onboarding.

---

## 13. Access control reality check

There is **no enforced content block** for partial-fee students. The `partialFeesBannerInfo`
resolver returns `null` after the warning window with the comment *"user should be banned"*, but
**no code suspends login or gates lectures** on fee status. The only real fee-based restrictions are:
- **Program-onboarding progress** is not tracked/visible unless `full_fees_paid` (backend + UI).
- **Legal-agreement modal** is hidden for partial-fee T0 students.
- **Callback-ticket team routing** (OPS vs NBFC).
- **Student-kit profile tab** / the **Student-Kit callback reason** are full-fee only.

The legal-agreement **non-closable → redirect-to-`/support`** path *is* a real block, but it's
driven by agreement acceptance state, not fee status.

---

## 14. End-to-end sequence

```
Onwards (admissions)                experience-api                         experience-ui (student)
        │ POST /auth/register-and-login                                              │
        │  { new_user_journey:true, seat_blocking_fees_paid:true, ... }              │
        ├─────────────────────────────────▶ create user_batch_admission_data         │
        │                                   (full_fees_paid=false → PARTIAL_FEES)     │
        │                                   ⮑ PARTIAL_PAYMENT Plivo call (4k)         │
        │                                                                            │
        │     me{ is_new_user_journey:true, feeStatus:PARTIAL_FEES } ◀───────────────┤ login
        │                                                                            │ → Welcome modal
        │                                                                            │ → Guided tour: LMS walkthrough
        │                                                                            │ → Program overview LOCKED 🔒
        │                                                                            │ → TIMER/WARNING payment banner
        │                                                                            │ → Legal agreement HIDDEN
        │   (daily 6PM IST) onboardingReminder cron → email + push if incomplete     │
        │                                                                            │
        │ POST /webhook/full-fee-payment                                             │
        ├─────────────────────────────────▶ full_fees_paid=true → FULL_FEES          │
        │                                   ⮑ FULL_PAYMENT Plivo call                │
        │     me{ feeStatus:FULL_FEES } ◀────────────────────────────────────────────┤
        │                                                                            │ → Program overview UNLOCKED
        │                                                                            │ → Legal agreement SHOWN
        │                                                                            │ → Student Kit tab; ID card reveal
```

---

## 15. Environment variables

- **Auth:** `ADMISSIONS_API_KEY` (register + full-fee webhook), `ONWARDS_LMS_API_KEY`
  (`/batches/import-students`), `ADMISSIONS_SSO_SECRET` (student-kit SSO).
- **Plivo:** `PLIVO_AGENTFLOW_URL_PARTIAL`, `PLIVO_AGENTFLOW_URL_FULL`, `PLIVO_AUTH_BASE64`,
  `DEFAULT_AGENT_NAME`, `PLIVO_FROM_NUMBER` (optional).
- **Slack callback:** `SLACK_TOKEN`, `SLACK_CALLBACK_NBFC_OPS_CHANNEL_ID` (def `C0ANE1ZLD0W`),
  `SLACK_CALLBACK_OPS_ALLPH_SUBTEAM_ID`, `SLACK_CALLBACK_OPS_ALLPL_SUBTEAM_ID`,
  `SLACK_CALLBACK_NBFC_{AKSHAT,VISHAL,PRIYANSHU}_USER_ID`.

---

## 16. Quick file reference

**Backend (`experience-api`)**
- `prisma/schema.prisma` — `user_batch_admission_data` (~4678), `user_callback_tickets` (~3004)
- `src/apollo/server.ts` — `/auth/register-and-login` (1808; row create 2310; partial call 2422), `/webhook/full-fee-payment` (2462)
- `src/features/user/resolver.ts` — `is_new_user_journey`/`feeStatus`/`partialFeesBannerInfo`/`idCardUrl` (198–379)
- `src/features/videoAttendance/guidedTourStep.service.ts` — progress compute/read (134, 252, 362, 475)
- `src/features/plivo/{plivo.service.ts,webhook.service.ts,resolver.ts}` — IVR calls + inbound webhook
- `src/services/onboardingReminder.service.ts` + `src/utils/queue.ts` (1896) — daily reminder cron
- `src/features/user/studentKit.service.ts` — kit tracking + admissions SSO URL
- `src/features/userCallbackTickets/*` + `src/services/callbackTicketNbfcOpsSlack.service.ts` — tickets + Slack

**Frontend (`experience-ui`)**
- `apps/student-experience/src/pages/newDashboard/index.tsx` — orchestration + payment banners
- `apps/student-experience/src/components/NewDashboard/{WelcomeModal,OnboardingProgressBanner,OnboardingProgressCard}.tsx`
- `apps/student-experience/src/context/GuidedTourContext.tsx` + `src/components/GuidedTour/*`
- `apps/student-experience/src/components/Dashboard/Common/Layout/index.tsx` + `components/LegalAggrementModal/*`
- `apps/student-experience/src/pages/profile/NewProfileMain.tsx`, `pages/tickets/BatchTickets.tsx`
- `apps/student-experience/src/utils/onboardingProgress.utils.ts`, `src/graphql/index.ts` (enums), `graphql/users/me.gql`
- `apps/admin/components/Batches/{Create,Edit,SingleBatch}.tsx`

---

## 17. Gotchas

- **`is_new_user_journey` ⇒ row exists.** No separate boolean column; deleting the row removes the
  student from T0 entirely.
- **No admission row ⇒ `FULL_FEES`** by design, so legacy students never see banners/gating.
- **`feeStatus` uses the latest row** (`created_at desc`) while progress/`meta` uses the **primary
  batch** (highest `batch_id`). For multi-batch students these can disagree — watch this when debugging.
- **Plivo calls never auto-retry** — the idempotency timestamp is written even on API failure.
  Re-running requires the admissions side to re-hit the webhook or a manual mutation.
- **Student-kit tracking id/courier/status are hardcoded** placeholders today.
- **"Onward" is overloaded:** the upstream admissions platform ("Onwards", key `ONWARDS_LMS_API_KEY`)
  that *drives* T0, vs. the `/batches/import-students` onward-batch progression feature, which is **not** T0.
- **The "ban" after the warning window is not implemented** — only the banner disappears.
