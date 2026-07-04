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

`DashboardPage` passes `overview.t0Flow` + `overview.t0FlowLectures` to
`T0FlowGate`, which renders `GuidedTourOverlay` (a full-screen overlay) when
`showGuidedTour` is true. "See dashboard" hides it for the visit; on reload the
overview refetches and the tour returns while onboarding is incomplete. Rendering
as an overlay (rather than branching the route) means the common non-T0 case
never flickers through a loading state.

**One dashboard GET.** The primary (first) batch's tour lectures come from
`overview.t0FlowLectures`; only when the learner switches to a *non-primary*
batch does the overlay fetch `/t0-flow-lectures?batchId=…` on demand. Completing
a step invalidates `['dashboard','overview']` (progress + primary lectures) and
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
  (profile photo, download app). *(Zoom authentication is not a tracked step.)*
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
                      └─ DownloadAppContent (shared w/ navbar DownloadAppModal)
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
   via `updateProfileAvatarByEmail` (the `update_profile_avatar_by_email` RPC —
   never blocks the upload). On success the tour refetches, so the step flips to
   complete. Mirrors experience-api's student `uploadProfilePicture`. The
   reusable Supabase admin client lives at `src/server/supabase/client.ts`
   (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — server-only secrets, no
   `VITE_`/`NEXT_PUBLIC_` prefix).

## Step sources

- **LMS:** walkthrough videos → profile-photo (a capture flow; complete when
  `status.profilePhotoUrl`) → download-app. The download-app panel is
  **informational** — it renders the shared `DownloadAppContent` (app QR codes +
  store badges, reused from the navbar's `DownloadAppModal`, no modal here).
  Clicking it never completes the step; it completes only when the **mobile
  app** creates a `user_device_tokens` row (`status.downloadAppCompleted`).
- **Program:** onboarding videos → agreement(s) (`legalAgreementSections`) →
  the non-counted extras when applicable: document upload, student kit, and the
  ID-card reveal (`idCardUrl`). The **agreement step** appears only when
  eligible; its panel is a **placeholder** ("The agreement form will come
  here") — the form itself is a later slice.

## Automation test hooks

| `data-testid`                       | Element                                       |
| ----------------------------------- | --------------------------------------------- |
| `guided-tour-overlay`               | Full-screen tour container                    |
| `guided-tour-see-dashboard`         | "See dashboard" escape                        |
| `guided-tour-tabs` / `-tab-lms` / `-tab-program` | Tab bar + tabs (program always shown; `data-locked` + `-tab-program-lock` icon when locked) |
| `guided-tour-batch-select` / `-batch-option-<id>` | Batch dropdown (multi-batch only) + options |
| `guided-tour-progress` / `-label`   | Progress bar + "N of M done" label            |
| `guided-tour-step-list`             | Ordered timeline step list                    |
| `guided-tour-step-<key>` (+ `-done`)| A step row (`-done` marker when complete)     |
| `guided-tour-hint`                  | Blue "watch the complete video" hint          |
| `guided-tour-active-panel` / `-active-title` | Right panel + active step title      |
| `guided-tour-back` / `-next`        | Step navigation buttons                       |
| `guided-tour-video` / `-video-missing` | Video player / no-video placeholder        |
| `guided-tour-panel-profile-photo` / `-download-app` / `-id-card` / `-agreement` / `-pending` | Fixed-step panels |
| `guided-tour-profile-photo-{placeholder,webcam,preview,existing}` | Capture / existing-photo states |
| `guided-tour-profile-photo-{enable,capture,retake,submit}` | Capture buttons             |
| `guided-tour-profile-photo-{done,error}` | Capture result states                       |
| `download-app-content` (+ `-google-play` / `-app-store`) | Reused app QR content (informational) |

## Open follow-ups

- Agreement signing form, document upload, and student-kit flows (rows exist;
  full UIs pending — panels currently link out / show a placeholder). Their
  backend APIs were removed in the frontend-unused cleanup and will be re-added
  with the form.