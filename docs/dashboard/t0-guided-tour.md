# T0 Onboarding — Guided Tour + gating (Phase 2)

For an eligible T0 user, the **Guided Tour** replaces the dashboard until
onboarding is complete. It has two tabs, **both always visible**: **LMS
Walkthrough** (always unlocked) and **Program Onboarding** (rendered but
**locked**, with a lock icon, until full fees are paid). Each tab is a progress
bar over an ordered list of steps.

**Multi-batch:** for users in more than one admission batch, a **batch
dropdown** sits above the two tabs. Selecting a batch re-drives the tabs,
progress, and steps for that batch (single-batch users see no dropdown).

## Who sees it, and when (the gate)

The backend owns the decision. It arrives in the **consolidated
`GET /api/dashboard/overview`** payload (`overview.t0Flow`) — no separate call —
which returns `showGuidedTour`, computed per the spec:

- **Partial fees** → show while the **LMS walkthrough** is incomplete.
- **Full fees** → show while the **LMS walkthrough OR program onboarding** is
  incomplete.

`DashboardPage` passes `overview.t0Flow` to `T0FlowGate`, which renders
`GuidedTourOverlay` (a full-screen overlay) when `showGuidedTour` is true. "See
dashboard" hides it for the visit; on reload the overview refetches and the tour
returns while onboarding is incomplete. Rendering as an overlay (rather than
branching the route) means the common non-T0 case never flickers through a
loading state.

**One dashboard GET — lectures are batch-level.** `t0Flow` is per-batch, so each
`t0Flow.batches[i]` carries its own `lectures` (walkthrough/onboarding videos,
agreement, flags). The **primary (first) batch's** lectures are populated inline
by the overview; other batches have `lectures: null` and the overlay fetches
`/t0-flow-lectures?batchId=…` on demand only when the learner switches to them.
Completing a step invalidates `['dashboard','overview']` (progress + primary lectures) and
`['dashboard','t0-flow-lectures']` (any open non-primary batch).

## Progress — one source of truth

The denominators are computed **once**, live, by
`src/server/api/dashboard/t0/guidedTourProgress.ts`
(`computeGuidedTourWebProgress`), and shared by:

- **`recordGuidedTourStepCompleted`** — writes the `*_web` fractions (and the
  `MAX(web, app)` aggregates) into `user_batch_admission_data.meta` on every
  video-step completion.
- **`getT0FlowStatus`** — returns per-batch `lms` / `program`
  `{ completed, total, complete }` and derives `showGuidedTour`.

This guarantees the progress bar and the gate can never disagree. Denominators:

- **LMS walkthrough:** `lms-walkthrough-web` lectures **+ 2** fixed steps
  (profile photo, download app). _(Zoom authentication is not a tracked step.)_
- **Program onboarding:** `program-onboarding-web` lectures **+ 1** when the
  batch has a valid signable agreement — only when full fees are paid.

`complete` combines the live web progress with the stored app fraction, so a tab
finished on the mobile app counts as done here too.

## Step completion (video steps)

A video step is complete once watched for **≥ 10s** (matches the backend's
`duration >= 10`). `GuidedTourVideoStep` tracks `timeupdate` and calls
`recordT0FlowStepComplete(lectureId, batchId, tab, watchedSeconds)` once, then
invalidates the status + lectures queries so the bar advances live. The platform
sent is **web**.

## Layout

A centred two-panel card ("Let's get you started" header + close X). **Left
panel:** batch dropdown (multi-batch) → both tabs → "Your Progress" + "N of M
done" with a green bar → the timeline step list (each step a card with a
state/type icon — check / half-ring / play / camera / download / … — a chevron,
and vertical connectors) → a blue completion hint. **Right panel:** the active
step's centred title, its video/content, and **Back / Next** navigation across
the current tab's steps.

## Frontend layering

```
DashboardPage
  └─ T0FlowGate                     (props from overview.t0Flow; decide tour vs dashboard)
       └─ GuidedTourOverlay         (card shell, batch dropdown, tabs, composes the two panels)
            ├─ steps.ts             (pure: build LMS / Program step models)
            ├─ GuidedTourStepList   (left: progress + timeline step list + hint)
            └─ GuidedTourActivePanel (right: title + content + Back/Next)
                 ├─ GuidedTourVideoStep  (video + ≥10s completion reporting)
                 └─ GuidedTourStepPanel  (fixed steps)
                      ├─ ProfilePhotoStep  (webcam capture → S3 → profile/user)
                      ├─ DownloadAppContent (shared w/ navbar DownloadAppModal)
                      ├─ AgreementStep      (config-driven form → PDFs → submit)
                      ├─ StudentKitStep     (admission-row states + SSO form link)
                      ├─ DocumentUploadStep (on-demand external status + SSO upload)
                      └─ IdCardStep         (locked → reveal image + download)
```

## Profile photo capture

The **Profile Photo** step (`ProfilePhotoStep`) is a real capture flow:

0. If a photo **already exists** (`status.profilePhotoUrl`), it's shown in the
   circle with a "Photo added" ✓ and a **Retake** button — the step is already
   complete; Retake opens the camera to change it.
1. **Enable Camera** mounts `react-webcam` (front camera, `facingMode: 'user'`,
   no audio) — which is what prompts for the camera permission.
2. **Capture Photo** calls `getScreenshot()` → a base64 JPEG data URL, shown as
   a round preview. **Retake** clears it; **Submit** uploads it.
3. Submit POSTs the data URL to `POST /api/dashboard/profile-photo`
   (`uploadProfilePhoto` service): the backend decodes it, uploads to S3
   (`uploadImageToS3`), then writes the URL to **`profiles.meta.profile_pic`**
   (upserting the profile row — this is what the progress check reads) and
   **`users.profile_photo_path`**, then best-effort syncs the Supabase avatar
   via `updateProfileAvatarByEmail` (the `update_profile_avatar_by_email`
   PostgREST RPC — never blocks the upload). On success the tour refetches, so
   the step flips to complete. Mirrors experience-api's student
   `uploadProfilePicture`. The RPC call lives at `src/server/supabase/profile.ts`
   and hits the REST API directly with `fetch` (no `@supabase/supabase-js`
   dependency) using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
   (server-only secrets, no `VITE_`/`NEXT_PUBLIC_` prefix).

## Step sources

- **LMS:** walkthrough videos → profile-photo (a capture flow; complete when
  `status.profilePhotoUrl`) → download-app. The download-app panel is
  **informational** — it renders the shared `DownloadAppContent` (app QR codes +
  store badges, reused from the navbar's `DownloadAppModal`, no modal here).
  Clicking it never completes the step; it completes only from the **mobile
  app** (`status.downloadAppCompleted`), via either of two signals resolved by
  `hasCompletedAppDownload` (`src/server/devices/hasCompletedAppDownload.ts`):
  a `user_device_tokens` row (any row — active or not), **or**
  `users.meta.firstAppLoginTrackedAt`, which the legacy API stamps on every
  app-authenticated `/users/me` call. The meta key is required because a token
  row only appears once the device also grants notification permission — on prod
  ~8% of tracked app users (~13% on iOS) never get one, and it is never created
  later, so a token-only check keeps nagging learners who already installed the
  app.
- **Program:** onboarding videos → agreement(s) (`legalAgreementSections`) →
  document upload → student kit → the ID-card reveal (capstone). The
  **agreement step** is a full inline flow — see [Legal agreement](#legal-agreement);
  the last three — see [Documents, kit & ID card](#documents-kit--id-card).

## Legal agreement

The agreement step (`agreement/AgreementStep`) renders **inline in the tour's
right panel — no modal**, mirroring the old LMS's form but rebuilt cleanly.

**Read (via overview):** each eligible section's full render detail is folded
into `overview.t0Flow.batches[i].lectures.legalAgreementSections[]` by
`agreement/getAgreementRenderData.service.ts` — ordered signable `steps`
(heading + `pdfUrl`, `hidePolicy`/`shouldModalBeVisible` stripped, ordered by
`order` with a legacy fallback), `savedValues` (prefill: profile scalars +
prior saves), `acceptedStepKeys`, `completed`, `referenceNumber`,
`agreementPdfUrl`.

A **horizontal stepper** (`AgreementStepper`) shows all sub-steps — Enter
Details → one per document (Program Agreement, Grading Policy, POSH Compliance,
Placement COC, … however many the section defines) → Signature Certificate —
with the current one highlighted and completed ones clickable to jump back.

**Flow:** a **config-driven detail form** (`agreementFormConfig.ts` +
`agreementValidation.ts`, rendered with the shared dumb
`components/ui/form-fields/*`) — **one field per row**, labels/placeholders
matching the old LMS → one embedded **PDF + consent checkbox** per document → a
**signature summary** that submits. The Back/Continue/Submit controls live in a
**sticky floating action bar** pinned to the bottom of the panel.

**Location** is a **consent checkbox** ("Allow location access to auto-fill your
current location") — not an editable field; checking it auto-detects via
`useAutoDetectLocation` (browser GPS → OpenStreetMap Nominatim) and shows the
address read-only below.

On **mobile** it shows the desktop-only notice (old-LMS behaviour). If already
signed, it shows the completed summary + a link to the generated PDF.

> The shared `SelectField`/`PhoneField` take a `contentClassName` so their
> dropdown panels can be lifted above the `z-[200]` tour overlay (`z-[210]`) —
> without it the dropdowns open _behind_ the overlay and appear to do nothing.
> The tour panels use `min-w-0` so the stepper scrolls horizontally instead of
> compressing the left card on small (≈13") screens.

**Write (two POSTs):**

- `POST /api/dashboard/agreement/save` — autosaves the detail form into
  `profiles.legal_data.agreements.section_<id>` (idempotent merge).
- `POST /api/dashboard/agreement/submit` — marks every step accepted
  (`haveAcceptedLegalAgreement`), captures the client IP, and generates the
  signed PDF (`buildAgreementPdf` — each doc's pages + a SIGNATURE CERTIFICATE
  page with a details table) → S3, storing `agreementPdfUrl`. Reference number:
  `TC-<userId>-section_<id>`. Non-blocking: no deadline / access-pause (a later
  decision).

## Documents, kit & ID card

The last three program steps. External admissions integration is segregated in
`src/server/admissions/` (`buildAdmissionsRedirectForUser` mints the SSO
redirect; `getAdmissionsStudentStatus` fetches external document status).

**Document upload and student kit are locked until every agreement is signed**
(`GuidedTourLockedNotice` shown in place of their content); the ID card is
locked until videos + agreements are complete.

- **Document upload** (`DocumentUploadStep`): uploads happen **externally** on
  the admissions portal. Completion (`documentsUploaded`) is the external system
  of record, so it's fetched **on demand** — `GET /api/dashboard/t0-flow-documents`
  (`getT0FlowDocuments`) → external status + an SSO upload link. Not in the
  overview (avoids a slow call on dashboard load).
- **Student kit** (`StudentKitStep`): DB-derived from the admission row (four
  states: not-applicable / not-filled → SSO form / filled-pending / tracking).
  Cheap, so `studentKit` rides in `overview.…batches[i].lectures.studentKit`.
  Details are filled externally; there's no LMS mutation. (Tracking id/courier
  are placeholders in the old LMS — surfaced as `null` here until admissions
  provides them.)
- **ID card** (`IdCardStep`): the capstone. Locked until every program video is
  watched **and** every agreement signed (frontend gate, from step completion);
  then reveals the image + download, or a "being generated" notice if
  `idCardUrl` isn't set yet. The URL comes from the admission row (set by
  admissions, not generated by the LMS).

**Env:** `ADMISSIONS_SSO_BASE_URL` + `ADMISSIONS_SSO_SECRET` (SSO redirects,
already used by referral); `ADMISSIONS_API_BASE_URL` + `ADMISSIONS_API_KEY`
(external document status — degrades gracefully if unset: the upload link still
works, status just shows not-uploaded).

## Automation test hooks

| `data-testid`                                                                                                                | Element                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `guided-tour-overlay`                                                                                                        | Full-screen tour container                                                                  |
| `guided-tour-see-dashboard`                                                                                                  | "See dashboard" escape                                                                      |
| `guided-tour-tabs` / `-tab-lms` / `-tab-program`                                                                             | Tab bar + tabs (program always shown; `data-locked` + `-tab-program-lock` icon when locked) |
| `guided-tour-batch-select` / `-batch-option-<id>`                                                                            | Batch dropdown (multi-batch only) + options                                                 |
| `guided-tour-progress` / `-label`                                                                                            | Progress bar + "N of M done" label                                                          |
| `guided-tour-step-list`                                                                                                      | Ordered timeline step list                                                                  |
| `guided-tour-step-<key>` (+ `-done`)                                                                                         | A step row (`-done` marker when complete)                                                   |
| `guided-tour-hint`                                                                                                           | Blue "watch the complete video" hint                                                        |
| `guided-tour-active-panel` / `-active-title`                                                                                 | Right panel + active step title                                                             |
| `guided-tour-back` / `-next`                                                                                                 | Step navigation buttons                                                                     |
| `guided-tour-video` / `-video-missing`                                                                                       | Video player / no-video placeholder                                                         |
| `guided-tour-panel-profile-photo` / `-download-app` / `-id-card` / `-agreement` / `-student-kit` / `-documents` / `-pending` | Fixed-step panels                                                                           |
| `student-kit-step` / `-fill` / `-pending` / `-track`                                                                         | Kit states (fill redirect / pending / tracking link)                                        |
| `document-upload-step` / `-continue` / `-done`                                                                               | Document upload redirect / uploaded state                                                   |
| `id-card-step` / `-locked` / `-generating` / `-image` / `-download`                                                          | ID-card locked / generating / revealed                                                      |
| `guided-tour-locked-notice`                                                                                                  | Documents/kit locked-until-agreement notice                                                 |
| `agreement-step` / `-mobile-notice` / `-completed`                                                                           | Agreement root / mobile notice / signed state                                               |
| `agreement-stepper` / `agreement-step-tab-<i>`                                                                               | Horizontal sub-step tabs (Enter Details → each doc → Signature Certificate)                 |
| `agreement-details-form` / `agreement-field-<key>`                                                                           | Detail form + each field                                                                    |
| `agreement-location` / `-location-consent` / `-location-value`                                                               | Location consent checkbox + detected address                                                |
| `agreement-action-bar`                                                                                                       | Sticky Back / Continue / Submit bar                                                         |
| `agreement-pdf-viewer` / `-pdf-iframe` / `-accept`                                                                           | Per-document PDF + consent                                                                  |
| `agreement-certificate` / `agreement-view-pdf`                                                                               | Signature summary / signed-PDF link                                                         |
| `agreement-back` / `-continue` / `-submit`                                                                                   | Agreement sub-step navigation                                                               |
| `guided-tour-profile-photo-{placeholder,webcam,preview,existing}`                                                            | Capture / existing-photo states                                                             |
| `guided-tour-profile-photo-{enable,capture,retake,submit}`                                                                   | Capture buttons                                                                             |
| `guided-tour-profile-photo-{done,error}`                                                                                     | Capture result states                                                                       |
| `download-app-content` (+ `-google-play` / `-app-store`)                                                                     | Reused app QR content (informational)                                                       |

## Open follow-ups

- Agreement: blocking / deadline behaviour is intentionally deferred (currently
  non-blocking); the 7-day access-pause from the old LMS is a later decision.
- Student-kit tracking id / courier / status come back as placeholders in the
  old LMS; surfaced as `null` here until admissions exposes them.
