# T0 Onboarding — Guided Tour + gating (Phase 2)

For an eligible T0 user, the **Guided Tour** replaces the dashboard until
onboarding is complete. It has two tabs — **LMS Walkthrough** (always unlocked)
and **Program Onboarding** (unlocked once full fees are paid) — each a progress
bar over an ordered list of steps.

## Who sees it, and when (the gate)

The backend owns the decision. `GET /api/dashboard/t0-flow-status` returns
`showGuidedTour`, computed per the spec:

- **Partial fees** → show while the **LMS walkthrough** is incomplete.
- **Full fees** → show while the **LMS walkthrough OR program onboarding** is
  incomplete.

`T0FlowGate` renders `GuidedTourOverlay` (a full-screen overlay) when
`showGuidedTour` is true. "See dashboard" hides it for the visit; on reload the
status refetches and the tour returns while onboarding is incomplete. Rendering
as an overlay (rather than branching the route) means the common non-T0 case
never flickers through a loading state.

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

## Frontend layering

```
DashboardPage
  └─ T0FlowGate                     (query t0-flow-status; decide tour vs dashboard)
       └─ GuidedTourOverlay         (tabs, progress bar, step list, active panel)
            ├─ steps.ts             (pure: build LMS / Program step models)
            ├─ GuidedTourVideoStep  (video + ≥10s completion reporting)
            └─ GuidedTourStepPanel  (fixed steps: profile photo, app, id card, …)
```

## Step sources

- **LMS:** walkthrough videos → profile-photo (complete when
  `status.profilePhotoUrl`) → download-app (complete when
  `status.downloadAppCompleted`).
- **Program:** onboarding videos → agreement(s) (`legalAgreementSections`) →
  the non-counted extras when applicable: document upload, student kit, and the
  ID-card reveal (`idCardUrl`).

## Automation test hooks

| `data-testid`                       | Element                                       |
| ----------------------------------- | --------------------------------------------- |
| `guided-tour-overlay`               | Full-screen tour container                    |
| `guided-tour-see-dashboard`         | "See dashboard" escape                        |
| `guided-tour-tabs` / `-tab-lms` / `-tab-program` | Tab bar + tabs (program only when unlocked) |
| `guided-tour-progress` / `-label`   | Progress bar + "n/total" label                |
| `guided-tour-step-list`             | Ordered step list                             |
| `guided-tour-step-<key>` (+ `-done`)| A step row (`-done` marker when complete)     |
| `guided-tour-video` / `-video-missing` | Video player / no-video placeholder        |
| `guided-tour-panel-profile-photo` / `-download-app` / `-id-card` / `-pending` | Fixed-step panels |
| `guided-tour-profile-photo-cta` / `-download-app-cta` | Fixed-step CTAs             |

## Open follow-ups

- Agreement signing form, document upload, and student-kit flows (rows exist;
  full UIs pending — panels currently link out / show a placeholder).
- Multi-batch: the tour currently drives the **first** admission batch.
- Confirm the final destinations in `t0Config.ts` (`APP_DOWNLOAD_URL`,
  `PROFILE_PHOTO_PATH`).