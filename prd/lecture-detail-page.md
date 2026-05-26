# PRD: Lecture detail page (`/lectures/:lectureId`)

**Example URL:** `http://localhost:3002/lectures/227`  
**Purpose:** Single reference for what the **legacy** student lecture detail experience implemented (UI + behaviour + backend), what the **new** LMS shows today, and what engineers should rebuild or port for parity.

**Source references**

| Area | Path in repo |
|------|----------------|
| Legacy page shell | `experience-ui/apps/student-experience/src/pages/lectures/lectureDetails/index.tsx` |
| Legacy GraphQL (lecture payload) | `experience-ui/apps/student-experience/src/graphql/lectures/lectureById.gql` |
| Legacy tab config | `experience-ui/apps/student-experience/src/pages/lectures/lectureDetails/variables.ts` |
| Legacy header / meta row | `experience-ui/apps/student-experience/src/components/Lectures/LectureDetails/LectureInfo/index.tsx` |
| New route | `student-lms-experience/src/routes/(protected)/_layout/lectures_/$lectureId/route.tsx` |
| New page component | `student-lms-experience/src/components/features/learn/LearnPageDetails/lecture/LectureDetailPage.tsx` |
| New loader / API | `student-lms-experience/src/server/learn/getLectureLearningDetail.ts`, `.../services/getLectureLearningDetail.service.ts` |
| Legacy API resolver | `experience-api/src/features/lecture/resolver.ts` (`lectureById`) |
| Legacy attendance API | `experience-api/src/features/attendance/resolver.ts` (`getNewAttendanceDetails`) |

---

## 1. Page intent

A learner opens a **single lecture** to:

- See **who, when, and what** (title, host, schedule, labels).
- Consume **video or live** content when allowed by schedule and product rules.
- Read **notes / description**, **AI-generated** aids, **transcript**, and **discussions**.
- Understand **attendance** implications for mandatory lectures.
- Give **feedback**, **bookmark**, **raise tickets**, and open **associated** assignments or other lectures.

The legacy app implements almost all of this on one scrollable page with optional **side panel** (desktop) and **bottom sheets** (mobile). The new app currently implements a **subset** (see section 5).

---

## 2. Routing and navigation

### Legacy (`experience-ui`)

- Path pattern: `/lectures/:id` with optional query `?tab=<tabValue>` (e.g. `transcript`, `notes`, `summary`, `ai-chat`, `discussions`, `associated`).
- **Reading-type** lectures redirect to default tab `notes` when no tab is set (resource flow uses `/resources/:id` with same behaviour).
- **Blended-learning** type: full redirect to `/blended-learning/:id`.

### New (`student-lms-experience`)

- Path: `/lectures/$lectureId` (TanStack Router file route).
- Loader validates `lectureId` is a positive finite number; otherwise throws `LEARN_DETAIL_NOT_FOUND`.
- Breadcrumb: Dashboard → Learn → **current lecture title** (`LearningDetailMasaiBreadcrumb`).

---

## 3. Legacy LMS — UI inventory (element by element)

Below is a **developer-oriented** checklist of what appears on the legacy lecture detail page, what it means, and which backend or client logic drives it.

### 3.1 Layout chrome

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **Max-width page container** (`md:max-w-[1440px]`) | Centers content on large screens. | None. |
| **Desktop breadcrumb** (`CoursesBredcurms`) | Trail: Dashboard → Learn → current title (lecture vs resource path aware). | Client routing; title from `lectureById.title`. |
| **Mobile breadcrumb** | Hidden on small screens in this layout (`md:block hidden` on breadcrumb wrapper). | None. |

### 3.2 Lecture header block (`LectureInfo`)

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **Title** (`h4`, tooltip) | Lecture title; tooltip repeats long titles. | `lectureById.title`. |
| **Attendance badge cluster** (separator dot + badge) | For **non-optional** lectures when attendance payload supports UI: shows states such as present, absent, continue watching, catch-up window over, etc. Uses `resolveLectureAttendanceUiState` with live + video progress hints. | `getNewAttendanceDetails` + `getVideoProgress` (see 4.2). |
| **Host / instructor name** | Primary display: `hostData.name`, fallback `user.name`. | `user_lecture_host_idTousers`, `user`. |
| **Schedule / conclude** (`TimeDisplay`) | Human-readable window from `schedule` and optional `concludes`. | `lectureById.schedule`, `concludes`. |
| **Category chip** | e.g. curriculum category. | `lectureById.category`. |
| **Module chip** | Module label when present. | `lectureById.module`. |
| **Mandatory vs Recommended** | Derived from `optional` boolean. | `lectureById.optional`. |
| **Status chip** | “Live” for `live` / `scrum`; “Resource” for `reading`; else “Recorded”. | `lectureById.type`. |
| **Legacy star feedback control** (`LectureFeedback`) | Shown when `isFeedbackEditable` (server time vs schedule/concludes window). | `feedback_id`, `lectureFeedbackFormVisibleTime` (client util). |
| **Raise a Ticket** | Opens subcategory picker then ticket creation modal; category context `lecture` vs `resource` from pathname. | Ticket modals; batch/lecture ids passed through. |
| **Bookmark** | Persists bookmark for entity type lecture. | `BookmarkButton` + bookmarks API (not detailed in lecture query). |

### 3.3 Video area (`LectureVideo`) — when `renderLectureVideo` is true

`renderLectureVideo` is true when:

- Type is **video** and lecture **has started**, or
- Type is **live** and lecture **has ended** (recording path), or
- Type is **interactive-video**.

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **Video player** | Plays Vimeo embed, Gumlet HLS, or S3/CloudFront URL after encoding. | `vimeo_player_embed_url`, `vimeo_download_links.gumlet.hls_url`, `videos`. |
| **Hide video** (`settings.hide_video`) | Suppresses player and clears video-related payloads in API response. | Parsed `lecture.settings` JSON in resolver. |
| **Side panel** (desktop, fixed height) | Default: **AI Tutor** (`AiTutor` + LiveKit `Room`). Can switch to tab content (transcript, notes, summary, AI chat, discussions, associated). | Transcript/AI from `lectures_ai`; LiveKit separate. |
| **Catch-up progress bar** | For mandatory lectures where section counts **video** toward attendance and learner is in “continue watching” state: shows days remaining; tracks play/pause for disclaimer. | `getNewAttendanceDetails` fields + optional `getVideoProgress`. |
| **“Associated Lectures & Assignments”** button under side panel | Opens `tab=associated` in side panel; red badge shows **count** of linked assignments + lectures. | `getAssociateAssignments` + `data.associatedLecture` + `associateWIthOtherLecture` (resolver-computed). |

### 3.4 Live session strip

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **`JoinLiveSessionsBanner`** | When lecture **is running** and type is `live` or `scrum` and `zoom_link` exists. | `zoom_link`, `useLectures` schedule helpers. |

### 3.5 Adaptive lecture recording

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **“Watch Recording”** button | When lecture **ended**, adaptive lecture (`zoom_link` contains `adaptive-lecture`), opens link in new tab. | `zoom_link`. |

### 3.6 Locked state

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **`LockedBanner`** | If lecture **has not started** (except `interactive-video`), shows unlock time. | `schedule`. |

### 3.7 Associated content entry points

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **“Associated Lectures & Resources”** row (before start or while live) | Shown if another lecture links to this one; opens `AssociatedLecturesResourcesDialog`. | Resolver `associateWIthOtherLecture` list + `data.associatedLecture`. |
| **`AssociatedLecturesResourcesDialog`** | Modal listing associated assignments and lectures with notes context. | Same as above + `getAssociateAssignments`. |

### 3.8 Instructor / product feedback (`LectureFeedbackNew`)

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **New feedback form** | Shown when `settings.show_feedback` and `isFeedbackEditable`. Range + text; loads/saves via `getLectureFeedback` / create update mutations. | `getLectureFeedback`, `createLectureFeedback`, `updateLectureFeedback` (GQL). |

### 3.9 Attendance disclaimer block (`AttendanceDisclaimer`)

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **Disclaimer copy** | Explains live vs recording attendance rules and current state for **mandatory** lectures with video rendered (layout varies with optional / adaptive). | `getNewAttendanceDetails` + UI state resolver. |

### 3.10 Two-column “Description + Discussions” (when video + non-adaptive)

When there is a **normal video layout** (`showDescriptionDiscussionsSideBySide`):

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **Description card** | Renders `NotesTab` with rich notes + embedded associated links; empty state if hidden or empty. | `notes`, `settings.hide_notes`, associations. |
| **Discussions card** | Embedded `DiscussionsPageForOtherPages` for this lecture id. | Discussions service (separate from lecture query). |

### 3.11 Tab strip (no side-by-side description layout)

When **no** side-by-side block (typically **no video** or adaptive path): horizontal **`Tabs`** from `tabOptionsToPass`.

| Tab value | Label | Meaning | Visibility rules |
|-----------|-------|---------|------------------|
| `transcript` | Transcript | Scrollable segments; click seeks video. | Only in **with-video** tab set; hidden if no video sources. |
| `notes` | Description | Same as `NotesTab`. | Removed entirely if `settings.hide_notes`. |
| `summary` | AI Summary | Renders AI summary text. | Requires video available and not `hide_video`; content from `lectures_ai[0].summary` and GPT central published flags for feedback. |
| `ai-chat` | AI Chat | Chat grounded in parsed `concepts` JSON. | Same video constraints; empty state if concepts invalid. |
| `discussions` | Discussions | Thread list / create. | Always in tab list when applicable. |
| `ai-tutor` | (filtered) | Tab value exists in full list but filtered unless transcript segments exist. | Shown only if `lectures_ai[0].transcriptSegments` and video exists. |
| `associated` | Associated… | Combined assignments + lectures. | Driven by side panel / mobile sheet, not always in primary tab list (see legacy code paths). |

**URL state:** clicking tabs sets `?tab=` and may toggle `isSidePanelShowingTabContent` for desktop split layout.

### 3.12 Mobile-only UI

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **AI Tutor / side content card** | When video + right panel possible but tab not one of the “sheet” tabs, shows stacked panel. | Same as desktop side panel. |
| **Bottom sheet** (`role="dialog"`) | For `notes`, `discussions`, `transcript`, `associated`, `summary`, `ai-chat`: 70vh sheet with handle, title, close; discussions can nest **Create Discussion**. | Same tab bodies. |
| **Practice quiz** | Hidden container when `tab=practice` (`LecturePracticeQuiz`). | Separate quiz API. |

### 3.13 GPT Central feedback (summary / concepts)

| UI element | Meaning / behaviour | Backend / data |
|------------|---------------------|----------------|
| **`InitialFeedbackQuestion`** | Thumbs up/down on AI summary/concepts when published, lecture ended, and no prior `getGptFeedback`. | `getGptFeedback`, `createGptFeedback`, `gpt_central_data` publish + `executionId`. |
| **`LastFeedbackOption`** | Shows prior rating when exists. | `getGptFeedback`. |

### 3.14 Other legacy integrations (commented or conditional)

- **Floating chatbot** link: gated by `gpt_central_data.enableBot` (currently commented out in page).
- **`AIFeedback`**, **`AIPractice`**, **`ContinueWatchingRecordingDisclaimer`**: imported or used in variations; main page flow above covers production paths in `index.tsx`.

---

## 4. Legacy LMS — backend logic (high level)

### 4.1 `lectureById` (`experience-api` / `lecture.resolver.ts`)

- **Authorization:** Loads all `section_user` rows for the current user; lecture must belong to one of those sections. If none, error `NO_SECTION_FOUND`. If lecture not found, `NO_DATA_FOUND`.
- **Interaction tracking:** Upserts `lecture_interactions` (`first_opened_at`, `last_opened_at`, `total_opens`) on every successful fetch (errors swallowed so the query still returns).
- **Zoom link scrubbing:** If `schedule` is more than ~10 minutes in the future (with IST offset logic in code), **`zoom_link` is cleared** before returning (reduces leaking join links early).
- **Settings parsing:** `lecture.settings` JSON controls `hide_video`, `hide_notes`, `show_feedback`, etc. When `hide_video` is true, response **strips** `videos`, `vimeo_player_embed_url`, `lectures_ai`, `proctor_config`.
- **Associated lectures:**
  - **`associateWIthOtherLecture`:** Scans other lectures in the same section whose `data.associatedLecture.id` points to this lecture; returns minimal lecture + host info.
  - **`data.associatedLecture`:** If present, resolver **hydrates** full associated lecture from DB and merges into `data`.
- **Interactive video:** If type is `interactive-video` and `settings.proctor_config_link` exists, loads JSON from S3 via `getProctorConfigJsonFromS3`.
- **Returns:** Prisma lecture row + `lectures_ai`, host user, normalized `data`, `settings`, Vimeo links, GPT central metadata, etc. (see `lectureById.gql` for the shape used by the client).

### 4.2 Supporting GraphQL / REST used by the same page

| Concern | Typical API | Role |
|---------|-------------|------|
| Attendance | `getNewAttendanceDetails` | Per-lecture, per-user attendance, catch-up days from **section settings**, video vs live breakdown, N/A flags. Still returns computed catch-up when **no** `student_attendances` row exists. |
| Video progress | `getVideoProgress` | Last position and watch percentage for progress bar and attendance UI blending. |
| Associated assignments | `getAssociateAssignments` | Assignments linked to this lecture + section. |
| Lecture feedback (form) | `getLectureFeedback`, mutations | Structured or legacy response shape for ratings + text. |
| GPT feedback | `getGptFeedback`, `createGptFeedback` | Stores learner rating/text for AI summary/concepts runs. |
| Discussions | Separate queries in `DiscussionsPageForOtherPages` | List/create threads for lecture entity. |
| Bookmarks | Bookmark mutations | Persist learner bookmarks. |
| Tickets | Ticket / subcategory APIs | Support workflow. |

---

## 5. New LMS — current `/lectures/:id` (what exists today)

The new lecture page is intentionally **minimal** compared to legacy. Implementers should treat section 3 as the **parity checklist** unless product scope is explicitly reduced.

### 5.1 Route and error UI

| Piece | Behaviour |
|-------|-----------|
| **Loader** | Calls `getLectureLearningDetail({ lectureId })`; requires authenticated user. |
| **Not found / forbidden** | Same error component as other learn entities: *“This item isn't available or you don't have access.”* (`LearnPageDetailError`) for bad id or failed access check. |

### 5.2 Access control (server)

`getLectureLearningDetailForUser`:

- Loads lecture by id where `deleted_at` is null and **type is not** resource type (`LECTURE_RESOURCE_TYPE` constant).
- **`ensureUserCanAccessLearnHubEntity`:** allows access if user is enrolled in lecture’s **batch** OR is an active **section_user** for the lecture’s **section**.
- Loads **discussions** via `listDiscussionsForLearnEntity` (public threads **or** threads authored by viewer; not deleted; ordered by `updatedAt` desc; thread counts aggregated).

### 5.3 Presentation payload

`buildLearnDetailPresentation` maps DB row to:

- `title`, `hostName` (fallback “Unknown Instructor”), `displayDate` (formatted schedule or “No schedule”), `priority` (`recommended` / `mandatory` from `optional`), `tags` = `[type, category, moduleName]` where module name is resolved from `module` + `week`.

### 5.4 On-screen UI (new)

| Region | Elements | Notes |
|--------|-----------|-------|
| **Breadcrumb** | Dashboard, Learn, lecture title | SPA links via `MasaiBreadcrumb`. |
| **Overview** | Title row + meta row | Title + **Raise Ticket** (redirects to **legacy** support URL via `getOldStudentUiUrlForPath`) + **Bookmark** button (**no-op** today — comment in code: “not wired yet”). |
| **Meta row** | Host name • date • chip per tag • priority chip | `LearnDetailMetaCard` / `MasaiChips`. |
| **Main column** | Dashed placeholder: “Lecture — main content area” | No video, notes, tabs, or attendance in new UI yet. |
| **Aside** | `EntityDiscussionsPanel` | Heading “Discussions”, **My Discussions** toggle (client filter by author id), scrollable `DiscussionSummaryCard` list, **Create** FAB opening `DiscussionCreateModal`, empty state with icon + copy. |

---

## 6. Implementation notes for the new LMS

1. **Treat legacy `lectureDetails/index.tsx` as the functional spec** for parity discussions: schedule gates, adaptive redirect, tab matrix, mobile sheets, and attendance UX are all explicit there.
2. **New server already differs from legacy auth:** legacy uses **section membership only** on `lectureById`; new uses **batch enrollment OR section membership**. Product should confirm which rule is canonical.
3. **New discussions query** already matches common product rules (public vs own private threads). Align any new lecture-specific discussion UI with `listDiscussionsForLearnEntity`.
4. **Priority order** if rebuilding incrementally: (a) video + progress + attendance, (b) notes + hide flags from settings, (c) live/join + locked states, (d) AI features, (e) associated content + tickets + bookmarks, (f) GPT central feedback.

---

## 7. Glossary

| Term | Meaning |
|------|---------|
| **Optional lecture** | `optional === true`; treated as **recommended** in new chips; skips several attendance UI paths in legacy. |
| **Resource / reading** | Legacy uses `type === 'reading'` and `/resources/:id` for the same detail shell; new learn hub treats resources as a separate route/type. |
| **Catch-up window** | Section-configured days after conclude during which recording watch can still satisfy video attendance (legacy `getNewAttendanceDetails`). |
| **`associateWIthOtherLecture`** | Lectures in the same section whose JSON `data.associatedLecture.id` references this lecture (inverse association list). |

---

*Document generated for PRD planning; align with product before treating any legacy behaviour as required in the new LMS.*
