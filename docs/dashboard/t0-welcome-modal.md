# T0 Onboarding — Welcome Modal (Phase 1)

The **T0 flow** is the new-student onboarding journey (a user is "in T0" iff
they have a `user_batch_admission_data` row — see the repo-root `T0-FLOW.md`).
Its frontend is being built on the dashboard slice by slice. **Slice 1** is the
**Welcome Modal**: the one-time celebratory greeting a freshly-admitted student
sees on their first dashboard visit.

## What the student sees

A centred dialog (desktop) or swipeable bottom drawer (mobile) with:

- a **5-second confetti** burst on open,
- the title **"Welcome to Masai!"** and a short intro line,
- an **embedded intro video** (fixed marketing asset), and
- a **"Get Started"** CTA.

Any exit path — the CTA, the cross, the backdrop, or Escape — dismisses it and
**persists that it was seen**, so it never reappears (even across reloads).

## Data flow

The backend already owns the "should this show?" decision — the frontend only
renders and reports dismissal.

```
GET  /api/dashboard/overview               → { …, welcomeModal: { showWelcomeModal } }
POST /api/dashboard/welcome-modal-dismiss  → marks users.meta.showWelcomeModal = true
```

- **Status:** `getWelcomeModalStatus.service.ts` — composed into the
  consolidated `overview` payload (`overview.welcomeModal`). `false` when the
  user has no admission row **or** `users.meta.showWelcomeModal === true`;
  otherwise `true`. (The standalone `/welcome-modal-status` GET was removed once
  the dashboard consolidated onto one call.)
- **Dismiss:** `dismissWelcomeModal.service.ts` — sets
  `users.meta.showWelcomeModal = true` (idempotent).
- **Client:** eligibility comes from `fetchDashboardOverview()`; dismissal via
  `dismissWelcomeModalApi()` — both in `src/lib/api/dashboard/dashboardApi.ts`.

## Frontend layering

```
DashboardPage
  └─ WelcomeModalGate            (data: query status, mutate dismiss, decide visibility)
       └─ WelcomeModal           (presentation: dialog on desktop / bottom drawer on mobile)
            └─ ConfettiOverlay    (shared celebration canvas — see below)
            └─ VideoPlayer        (reused ui/video-player.tsx)
```

- `src/components/features/dashboard/t0/WelcomeModalGate.tsx` — owns the
  React Query wiring. Optimistically hides the modal on dismiss and persists the
  flag (`onSettled` invalidates the status query).
- `src/components/features/dashboard/t0/WelcomeModal.tsx` — presentation only.
  Picks bottom drawer vs. dialog via `useIsMobileViewport`.
- `src/components/features/dashboard/t0/t0Config.ts` — static config: the intro
  video URL/poster (a fixed asset, not per-user data — **TODO** swap for the
  final published asset) and the confetti duration.

## Reused building blocks

- **`ConfettiOverlay`** (`src/components/ui/confetti-overlay.tsx`) — the confetti
  canvas was extracted from `CertificateCard` into a shared, pointer-transparent
  overlay with a `durationMs` prop, so the certificate reveal and this modal
  share identical burst behaviour. Drop it inside any `relative` container.
- **`ui/video-player.tsx`**, **`ui/modal.tsx`**, **`ui/bottom-drawer.tsx`**, and
  **`useIsMobileViewport`** are all reused as-is.

## Automation test hooks

| `data-testid`                    | Element                                  |
| -------------------------------- | ---------------------------------------- |
| `welcome-modal`                  | Desktop dialog content                   |
| `welcome-modal-body`             | Shared inner content (both layouts)      |
| `welcome-modal-title`            | "Welcome to Masai!" heading              |
| `welcome-modal-body-text`        | Intro copy                               |
| `welcome-modal-video`            | Embedded intro video player              |
| `welcome-modal-get-started`      | "Get Started" CTA (disabled while saving)|
| `welcome-modal-confetti`         | Confetti canvas                          |

## Guided Tour + dashboard gating (Phase 2)

When a T0 user is eligible, the **Guided Tour** is shown *instead of* the
dashboard. See [t0-guided-tour.md](./t0-guided-tour.md).

## Not yet built (later T0 slices)

The Program Onboarding **agreement signing** form, **document upload**, and
**student kit** flows (their rows appear in the tour but link out / show a
placeholder for now), plus the **payment / onboarding nudge banners**. The
backend for these already exists (see `T0-FLOW.md` and the agreement /
payment-banner services).
