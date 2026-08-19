# Profile page — rebuild plan (new LMS)

Companion to `old-lms-audit.md`. Target route: `/profile` (currently a blank
slate at `src/routes/(protected)/_layout/profile/index.tsx`).

Everything here is REST-only (`src/routes/api/profile/**` → handler → service),
Drizzle query builder, shadcn/Radix + `@phosphor-icons/react`, semantic theme
tokens, `dash-*` motion kit, `data-testid` on every element, `pushGtmEvent` on
every interactive, and colocated Vitest at 100% coverage for touched modules.

## Scope

**In:** the seven live tabs, the header card, and the Achievements panel.
**Out:** `/profile-settings` (already covered by the navbar dropdown), the badge
OG landing page (keep linking to the existing API endpoint), and everything in
the audit's "Do not rebuild" table.

### Decisions taken (2026-08-12)

- **Certificates tab is always shown.** The old `CERTIFICATE_VIEW === 'NEW'`
  build-time gate is dropped; an empty state covers students with no certificates.
- **Avatar upload is added** (a deliberate addition, not old-LMS parity): a camera
  overlay on the header avatar posting to the existing
  `POST /api/dashboard/profile-photo`.
- **Email preference toggles keep confirming in both directions**, matching the
  old page. This overrides improvement #5 below.

## API surface

All under `/api/profile/*`, one file route per endpoint.

| Method + path                                      | Service                                               | Returns / accepts                                                                                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/profile`                                 | `getProfileOverview.service.ts`                       | header payload: name, email, avatar url, secondary mobile, `studentCodes[{code,batchId,batchName}]`, plus the tab-gating flags (`feeStatus`, `isNewUserJourney`) so the tab list resolves in one round trip |
| `PATCH /api/profile`                               | `updateProfile.service.ts`                            | `{ name? , secondaryMobile? }` — validated server-side, never trusts a client user id                                                                                                                       |
| `PUT /api/profile/password`                        | `updatePassword.service.ts`                           | `{ currentPassword, newPassword }` → 400 on wrong current password                                                                                                                                          |
| `GET /api/profile/sessions`                        | `getSessions.service.ts`                              | parsed device list + `isCurrent` flag                                                                                                                                                                       |
| `DELETE /api/profile/sessions/$sessionId`          | `removeSession.service.ts`                            | ownership-checked                                                                                                                                                                                           |
| `DELETE /api/profile/sessions`                     | `removeAllSessions.service.ts`                        | keeps the caller's own session alive                                                                                                                                                                        |
| `GET /api/profile/email-preferences`               | `getEmailPreferences.service.ts`                      | six flags, default-on                                                                                                                                                                                       |
| `PATCH /api/profile/email-preferences`             | `updateEmailPreferences.service.ts`                   | partial write into `profiles.meta.email_notifications`                                                                                                                                                      |
| `GET /api/profile/undertakings`                    | `getUndertakings.service.ts`                          | pending list                                                                                                                                                                                                |
| `POST /api/profile/undertakings/$sectionId/accept` | `acceptUndertaking.service.ts`                        | `{ ipAddress, location }`, enrolment-checked                                                                                                                                                                |
| `GET /api/profile/achievements`                    | `getAchievements.service.ts`                          | grouped-ready flat list (port the eligibility + collapse logic from the audit)                                                                                                                              |
| `GET /api/profile/certificates`                    | reuse/extract from `getCourseCertificates.service.ts` | all batches, not one                                                                                                                                                                                        |
| `GET /api/profile/student-kit`                     | `getStudentKit.service.ts`                            | wraps `getAdmissionsStudentStatus(code, 'kit')`                                                                                                                                                             |
| `GET /api/profile/invoices`                        | `getInvoices.service.ts`                              | wraps `getAdmissionsStudentStatus(code, 'invoices')` — needs `invoices` added to that client's typings                                                                                                      |

Notes carried over from the audit:

- Student codes come from `batch_user`, **not** `users.username`.
- `batches.id` is MySQL `UNSIGNED INT`; keep it a JS number, never a 32-bit-signed
  assumption.
- Achievements' _locked_ entries come from `badge_configs` on enrolled sections;
  earned ones collapse per `badge_config_id` with the earliest `release_date`.
- Undertaking acceptance state lives at
  `profiles.legal_data.undertakings.section_{id}.accepted`.

Client access via typed `fetchJson` helpers in `src/lib/api/profile/profileApi.ts`

- query options in `src/query/profile/`. Each tab's query is **lazy** — it only
  fires when that tab is active (the old page already did this for kit/invoices).

`GET /api/me` gets extended with `feeStatus` and `isNewUserJourney` only if the
navbar needs them independently; otherwise those flags ride on `GET /api/profile`.

## Component layout

Under `src/components/features/profile/`, every file under the 200-line cap:

```
ProfilePage.tsx              orchestrator: header + achievements + tab shell
ProfileHeaderCard.tsx        avatar, name, student-code links, email, phone
ProfileTabs.tsx              tab list built from gating flags, syncs ?tab=
achievements/
  AchievementsPanel.tsx      program pills → module pills/select → badge grid
  AchievementBadge.tsx       badge tile + modal + LinkedIn share
  useAchievementGroups.ts    pure grouping/sorting (unit-tested standalone)
details/
  ProfileDetailsTab.tsx      card grid
  EditableFieldCard.tsx      shared inline-edit card (name, phone)
  ChangePasswordCard.tsx     three-field form
  validateMobile.ts          the 6/7/8/9→10-digit vs 7–15 rule, pure
activity/
  AccountActivityTab.tsx     list + "sign out everywhere"
  SessionCard.tsx            device icon, UA, last-active, revoke
undertakings/UndertakingsTab.tsx + UndertakingPdfDialog.tsx
email-preferences/EmailPreferencesTab.tsx
student-kit/StudentKitTab.tsx
invoices/InvoicesTab.tsx
certificates/CertificatesTab.tsx
shared/profileAnalytics.ts   pushProfileEvent wrapper, `l_profile_` prefix
```

Reuse, don't rebuild: `masai-tab`, `modal`/`masai-drawer`, `masai-input`,
`password-input`, `switch`, `dialog`, `skeleton`, `avatar`, `CertificateCard`,
`confetti-overlay`.

## UX improvements (same visual language, better behaviour)

Each of these fixes something concretely wrong or missing in the old page:

1. **Tabs → responsive**: horizontal scroll-snap strip on mobile with edge fade
   (old page relied on `overflow-x-scroll` with no affordance), full row on desktop.
2. **Real empty states.** The old acknowledgement tab renders a blank panel when
   nothing is pending, and Achievements/Certificates render `null` entirely.
   Replace with friendly `animate-dash-pop` / `animate-dash-float` empty states
   ("You're all caught up", "Badges appear as you complete modules").
3. **Skeletons, not spinners** — `dash-skeleton` mirroring each tab's real layout.
4. **Undertakings: ask for location at the point of intent**, not eagerly on
   mount. Explain _why_ before prompting, and show a retry path on denial. The
   old flow fires a geolocation prompt the moment the tab loads and dead-ends on
   "Please enable location access" with no recovery.
5. ~~Optimistic email toggles.~~ **Superseded by the decision above** — the
   confirm dialog stays on both directions. The toggle still reflects state
   optimistically once confirmed and rolls back on failure.
6. **Sessions: mark the current device** ("This device" chip, not revocable from
   the row) and drop the always-empty location line. Add the missing empty state.
   "Sign out of all devices" keeps the current session and says so.
7. **Password field affordances**: real `password-input` eye toggles, a live rule
   checklist (≥8 chars, no spaces, matches) instead of a single mutating error
   string, and submit disabled until valid.
8. **Phone editing**: show the constraint before the user trips it ("10 digits
   for Indian numbers"), which the old hint block computed and then threw away.
9. **One editor at a time, honestly.** Keep the single-open-editor model but use
   `disabled` + `aria-disabled` on the other cards instead of a 45%-opacity div
   that still accepts clicks.
10. **Student Kit**: copy-to-clipboard gets real confirmation feedback and an
    `aria-live` announcement; the tracking link gets an explicit external-link
    affordance.
11. **Deep-linkable tabs** stay (`?tab=`), with an invalid value redirecting to
    `details` — same as today, but via `validateSearch` so it's typed.
12. **Certificates**: the old modal iframes a remote verification page inside a
    dialog. Keep the preview, but make "Open in new tab" the primary action and
    handle the iframe-refuses-to-embed case instead of showing a blank frame.

Motion budget stays restrained: `animate-dash-rise` on panel entry,
`animate-dash-row-in` with a capped stagger for lists, `dash-lift` on session /
invoice / certificate cards, `animate-dash-pop` on the achievement count badge.
No `dash-sheen` on cards with absolutely-positioned badges.

## Theming

Zero hardcoded colours. The old page is full of `#6962AC`, `#3470E4`,
`#EBF5FF`, `bg-white`, `text-gray-900` — all map to `bg-brand`/`text-brand`,
`bg-surface`/`bg-card`, `text-foreground`/`text-foreground-muted`,
`border-border`. Badge theme1/2/3 decorative gradients keep their light classes
and gain `dark:` overrides. `npm run check:contrast` must pass; verify in
`/theme-lab` plus one dark theme.

## Testing

- Services: happy path + auth failure + not-found/empty for each.
- Pure modules (`validateMobile`, `useAchievementGroups`, preference defaults,
  session UA parsing) get exhaustive unit tests — these carry the branch coverage.
- Components: Testing Library behaviour tests — tab switching updates the URL,
  inline edit save/cancel, password validation gating, toggle rollback on
  failure, revoke-session confirm flow, every empty state.
- Update `docs/testing/feature-test-matrix.md`, add
  `docs/testing/features/profile.md`, complete `docs/testing/pr-checklist.md`.
- Seed flow `seed/flows/profile/` creating its own user + batch + sections +
  badges + `user_badges` + `sessions` + a pending undertaking, namespaced by flow
  id, so every tab is demoable via `/seed-catalog`.

## Build order

1. Foundations — `GET /api/profile`, header card, tab shell, route search params.
2. Profile Details (name / phone / password) — the highest-traffic tab.
3. Account Activity.
4. Email Preferences.
5. Achievements (biggest port: service logic + badge component + grouping).
6. Undertakings.
7. Certificates.
8. Student Kit + Invoices (both depend on the Admissions client gaining `invoices`).
9. Theme + contrast + responsive pass, `/theme-lab`, seed flow, docs.

Each step is independently shippable: route + handler + service + client helper +
component + tests + testids + GTM events, in one go.
