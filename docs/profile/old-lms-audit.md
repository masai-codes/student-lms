# Old LMS `/profile` — Feature Audit

Source of truth for the rebuild. Audited 2026-08-12 against
`experience-ui/apps/student-experience` + `experience-api`.

## Routing reality check

`experience-ui/src/pages/Routes.tsx` mounts exactly two profile routes:

| Route               | Component                               |
| ------------------- | --------------------------------------- |
| `/profile`          | `pages/profile/NewProfileMain.tsx`      |
| `/profile-settings` | `pages/profile/ProfileSettingsPage.tsx` |

`pages/profile/index.tsx` (357 lines) is **not routed** — dead. Everything it
uniquely imports is therefore dead too (see "Do not rebuild").

## Live surface of `/profile`

### A. Header card (inline in `NewProfileMain`)

| Element         | Data source                                                                          | Notes                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Avatar          | `profile.meta.profile_pic`, else 2-letter initials                                   | no upload affordance here (the `IoAddCircle` overlay is commented out)                                                                           |
| Display name    | `profile.user.name ?? me.name`                                                       |                                                                                                                                                  |
| Student code(s) | `me.studentCodes` → fallback `profile.studentCodes` → fallback `username`            | from `batch_user` (source of truth; `users.username` is stale). Multiple codes render comma-separated, each linking to `/new-courses/{batch_id}` |
| Email           | `profile.user.email ?? me.email`                                                     | `MdOutlineMail` icon                                                                                                                             |
| Phone           | `profile.secondary_mobile`                                                           | rendered only when present, `LuPhone` icon                                                                                                       |
| Mobile chrome   | back button + centred "My Profile"; desktop shows `BreadCrumbs` + left-aligned title |

### B. Achievements panel (`components/Profile/Achievements.tsx`)

Always rendered between header and tabs. Returns `null` when the user has zero
badges. Two-level grouping:

1. **Programs** — pill row, grouped by `courseTitle` (fallback `"Other"`), each
   pill shows a total count across that program's modules.
2. **Modules** — within the active program, grouped by `sectionModuleName`
   (fallback `"General"`). Desktop = pills with counts; mobile = native `<select>`.
3. **Badges** — earned first, locked last (`sortLockedLast`). Each badge renders
   via the shared `Badge` component (337 lines): modal open, locked/unlocked
   state, `xN` count label, `theme1|2|3`, first-unlocked date, LinkedIn share
   text, and a share URL pointing at the API's server-rendered OG landing page
   `{restBase}/badge/{badge_url_key}`.

Data: `GET {restBase}/users/me/achievements` →
`experience-api` `user.controller.ts#getMyAchievements`. Logic worth preserving:

- Enrolled sections = `section_user` where `deleted_at IS NULL`.
- Eligible configs = `badge_configs` for those `section_id`s (this is what
  produces the _locked_ badges).
- `user_badges` rows are kept only if their `badge_config_id` is eligible.
- Duplicates collapse per `badge_config_id` into `count`, keeping the
  **earliest** `release_date`.
- `courseTitle` from `batches.meta`, `sectionModuleName` from `sections.module`
  (sentence-cased).
- Badge images pass through an S3→CDN mapper.
- Earned badges get an opaque signed `badge_url_key`; locked badges get none.

### C. Tabs (dynamic, driven by `?tab=`)

Order and visibility conditions, verbatim from `NewProfileMain`:

| #   | Label             | `tab` value         | Shown when                                                                                                                           |
| --- | ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Profile Details   | `details`           | always                                                                                                                               |
| 2   | Student Kit       | `student-kit`       | `me.feeStatus === 'FULL_FEES'` **and** `me.is_new_user_journey` **and** `kit.showKit` (kept visible while that request is in flight) |
| 3   | acknowledgement   | `undertakings`      | always (label is lowercase in prod)                                                                                                  |
| 4   | Account Activity  | `activity`          | always                                                                                                                               |
| 5   | Certificates      | `certificates`      | `CERTIFICATE_VIEW === 'NEW'` (build-time constant)                                                                                   |
| 6   | My Invoices       | `invoices`          | `me.is_new_user_journey`                                                                                                             |
| 7   | Email Preferences | `email_preferences` | always                                                                                                                               |

An unknown `?tab=` value redirects to the first tab.

`guardian-details` is rendered by `NewProfileMain` but **has no tab entry** — it
is unreachable in production. Treated as dead.

#### 1. Profile Details → `ProfileDetails/Single/index.tsx` (`UserDetails`)

Three cards in a 2-col grid, one-at-a-time inline editing (`edit` state string;
the other cards dim to 45% opacity while one is open):

- **Name** — text input, Edit → Cancel/Save. Mutation `updateProfile`.
- **Phone number** — digits only; first digit `6|7|8|9` ⇒ Indian, max/required
  length 10; otherwise international, 7–15 digits. Save disabled until valid.
  Mutation `updateProfile`.
- **Password** — Edit swaps the card for a form: current / new / confirm, each
  with an eye toggle (`eyeCard.tsx`). Rules: min 8 chars, no spaces, confirm
  must match. Live inline hint/error. Mutation `updatePassword` (verifies the
  current password server-side, bcrypt-rehashes).

Success/error surface as toasts; `Me` + `Profile` queries are refetched.

Dead within this file: Date-of-Birth card, Gender card, and an older Password
card — all commented out. The mobile validation "hint" block computes a message
that is hard-coded to `''`, so it never renders.

#### 2. Student Kit → `StudentKit/index.tsx`

Three mutually exclusive states off the `kit` section of student-status:

1. `!detailsFilled && showKit` → "Redirecting you to Admissions" + Continue link
   to `kit.admissionsFormUrl`.
2. `detailsFilled` but no `tracking.trackingUrl` → success tick + "Student Kit
   Details Submitted / Tracking details will be shared soon".
3. Has tracking URL → Tracking ID (copy-to-clipboard) + Tracking Link (opens new
   tab) + a 3-step how-to list and a static screenshot image.

#### 3. acknowledgement → `UnderTaking/index.tsx`

- `shouldUndertakingModalBeVisible` returns the sections whose
  `sections.settings.undertaking_template.shouldModalBeVisible` is true, that
  have a `pdfUrl`, and that the user has **not** already accepted
  (`profiles.legal_data.undertakings.section_{id}.accepted`).
- Renders one card per pending undertaking: section name + `program - batch`,
  "View" button (desktop) / chevron (mobile).
- View opens a dialog with the PDF in an `<iframe>` + "Accept Undertaking".
- Accepting requires **geolocation** (reverse-geocoded to an address via
  `nominatim.openstreetmap.org`) and the **public IP** (`api.ipify.org`), both
  sent to `acceptUndertaking({ section_id, ip_address, location })`.
- Geolocation is requested eagerly on mount when something is pending.
- Empty state: the whole panel renders blank (no copy) when nothing is pending.
- Contains a `console.log('IP-undertakingData', …)` and a hidden launch-form
  banner — both to be dropped.

#### 4. Account Activity → `AccountActivity/index.tsx`

- Copy: "Manage your active sessions on other browsers and devicess." (typo in prod).
- `sessions(user_id)` → rows from the `sessions` table with `user_agent` parsed
  server-side into `"{family} {major}.{minor} ({os})"`.
- Per-card: device-type icon (laptop / tablet / mobile, sniffed from the UA
  string), UA string, location, last-activity date + time, and a relative
  `TimeDisplay`. Whole card is a button; tapping it opens a confirm modal →
  `removeSession(id)`.
- Footer: "SIGN OUT OF ALL DEVICES" → confirm modal → `removeAllSessions(user_id)`.
- **`location` is hard-coded to `null` in the resolver** (the IP lookup is
  commented out), so the location line is always empty. The UI's
  `'undefined, undefined, undefined' → 'Unkown'` guard is vestigial.
- No empty state, and no "this is your current device" marker (the
  `time === 'Your current device'` comparison can never be true — `time` is a
  formatted timestamp).

#### 5. Certificates → `NewCertificates/index.tsx`

- `getMyProfileCertificates(batchId?)`; renders `null` when the list is empty.
- Card: title, type, issue date (`dd MMM yyyy`, en-IN), batch name.
- **View** → modal with the verification URL in an `<iframe>`, plus Share and
  "Open in new tab"; fires 5s of confetti. Disabled when the verification URL is
  absent/non-http.
- **Share** → copies a LinkedIn post text to the clipboard and opens
  `linkedin.com/sharing/share-offsite?text=…`.

#### 6. My Invoices → `MyInvoices/index.tsx`

- Rows from the `invoices` section of student-status: payment type, `paidOn`
  (locale date), amount (`₹` + `en-IN` grouping), and a **View** button when
  `invoiceUrl` is present.
- Empty state: `FileText` icon + "No invoices yet / Your invoices will appear here".

#### 7. Email Preferences → `EmailPreferences/index.tsx`

- Six toggles: Lectures, Assignments, Evaluations, Announcements, Tickets,
  Discussions. (The API also supports `messages` and `app_download_reminder`;
  the UI does not expose them.)
- Every toggle opens a **confirmation dialog** before the write
  ("Enable/Disable email notifications for X?"), then
  `updateNotificationPreferences({ [key]: value })`.
- Defaults are **all-on**; storage is `profiles.meta.email_notifications`
  (no dedicated table).

## Adjacent page: `/profile-settings`

A mobile-first "Profile & Settings" hub — profile summary card linking to
`/profile`, a Refer & Earn / Admissions Platform promo, a config-driven menu
list (`profileSettingsConfig`), Level up SSO, Product Updates, and Log Out.
In the new LMS this is already covered by the navbar profile dropdown +
`useAppNavItems`, so it is **not** part of this rebuild.

## Do not rebuild (dead or stale in the old LMS)

| Thing                                                                                                                                                         | Why                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `pages/profile/index.tsx`                                                                                                                                     | not routed                                                        |
| `Profile/Documents/**`                                                                                                                                        | only referenced by the dead page                                  |
| `Profile/Integration/**` (GitHub + Zoom cards)                                                                                                                | only referenced by the dead page                                  |
| `Profile/PrePlacements/**`                                                                                                                                    | only referenced by the dead page                                  |
| `Profile/Certificates/**` (old)                                                                                                                               | superseded by `NewCertificates`, only referenced by the dead page |
| `Profile/GuardianDetaiils/**`                                                                                                                                 | imported by `NewProfileMain` but no tab renders it                |
| `Profile/Modal/GithubModal.tsx`, `ProfileDetails/Document.tsx`                                                                                                | orphaned                                                          |
| DOB + Gender cards, old Password card                                                                                                                         | commented out                                                     |
| `getUsersDocuments` / `storeDocumentUrl` / `deleteDocumentUrl` / `uploadProfilePicture` / `removeSocialMediaLink` / `createUserLegalAgreementPDF` GraphQL ops | not called from any live profile surface                          |
| Launch-form banner (`showLaunchForm`)                                                                                                                         | rendered inside `hidden` / `display:none` wrappers                |
| `profileCompletion = 70` ring                                                                                                                                 | hard-coded and commented out                                      |
| Session `location` line                                                                                                                                       | resolver always returns `null`                                    |

## Data-layer inventory (old → what the new LMS needs)

| Old operation                                                  | Transport                       | New LMS status                                                                                               |
| -------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `profile` query                                                | GraphQL                         | build (`profiles` + `users` + `batch_user` are in the Drizzle schema)                                        |
| `me` (feeStatus, is_new_user_journey, studentCodes)            | GraphQL                         | `GET /api/me` exists but returns only `name` — must be extended                                              |
| `updateProfile`                                                | GraphQL                         | build                                                                                                        |
| `updatePassword`                                               | GraphQL                         | build (needs bcrypt verify + rehash)                                                                         |
| `sessions` / `removeSession` / `removeAllSessions`             | GraphQL                         | build (`sessions` table already in schema)                                                                   |
| `getNotificationPreferences` / `updateNotificationPreferences` | GraphQL                         | build (reads/writes `profiles.meta.email_notifications`)                                                     |
| `shouldUndertakingModalBeVisible` / `acceptUndertaking`        | GraphQL                         | build (`sections.settings`, `profiles.legal_data`)                                                           |
| `GET /users/me/achievements`                                   | REST                            | build (`badges`, `badge_configs`, `user_badges` all in schema)                                               |
| `GET /users/student-status?include=kit,invoices`               | REST proxy to Admissions        | `src/server/admissions/getAdmissionsStudentStatus.ts` exists — needs `invoices` added to its typings/include |
| `getMyProfileCertificates`                                     | GraphQL                         | close analogue exists: `GET /api/course/$batchId/certificates` + `getCourseCertificates.service.ts`          |
| Badge OG landing page `/badge/{key}`                           | server-rendered HTML on the API | out of scope — keep pointing share links at the existing API endpoint                                        |
