# Lecture detail page

## Scope

- Route: `/lectures/$lectureId`
- Live lecture phases: before start, during live, after live (with / without recording)
- Video lecture phases: `before`, `during_after` (with / without recording)
- Server payload: `getLectureLearningDetail` → `LectureDetailPayload` (all tab bodies from DB; no static lecture copy)
- Tabs: single **Description** tab renders `lectures.notes` (legacy parity — no separate Notes tab, and `lectures.description` is not surfaced). `settings.hide_notes` hides the Description tab; the active tab falls back to the first visible tab.
- Mutations are REST (no `createServerFn`): video progress `POST /api/learn/lectures/:id/video-progress`; create discussion `POST /api/learn/discussions`; add reply `POST /api/learn/discussions/:id/replies`; bookmark `POST`/`DELETE /api/learn/lectures/:id/bookmark`; feedback `POST /api/learn/lectures/:id/feedback`.
- Live join: `zoomLink` is schedule-scrubbed, then adaptive ("SAL") links are rewritten to the lecture-scoped form via `toLectureScopedAdaptiveLink` (parity with legacy). ZEF (`is_new_zoom_redirection`): payload carries `isNewZoomRedirection`; when set, the active join button calls `POST /api/learn/lectures/:id/zoom-redirect` and opens the returned ZEF URL, falling back to the raw link on failure. The ZEF token is **minted locally in the new LMS** (`zoomRedirectionToken` — groupLectureIdentifier resolution, admin host-email mapping, HS256 signing) and the base host (`zoom.masaischool.com` vs `zoom.ihubiitrcourses.org`) is chosen from the batch duration. Requires env `ZOOM_REDIRECTION_JWT_SECRET`. New schema columns mapped: `lectures.is_new_zoom_redirection`, `lectures.zoom_details`.
- **Zoom Web View** (embedded Zoom flavour, 3rd option after ZEF/SAL): gated by `sections.settings.enableZoomWebView` (mapped to the payload via a `sections` join → `resolveEnableZoomWebView`). We do **not** re-implement the Zoom Web SDK in the new LMS — the join CTA instead opens the **old LMS** embedded page `${getOldStudentUiUrlFromEnv()}/lectures/:id/zoom` (shared session cookie), reusing its signature/config backend. Join ladder (mirrors legacy `LectureBegun.tsx`, same priority): ZEF → Zoom Web View → SAL/raw link. Web View only triggers for a shown, non-adaptive, non-ZEF link; falls back to the raw link if the legacy base URL is unresolved. URL built by the shared `buildZoomWebViewUrl` (`src/lib/learn/zoomWebView.ts`); analytics tag `join_method: 'zoom_web_view' | 'zoom_link'`.
- Header actions: `LectureDetailActions` (Raise Ticket → legacy support redirect + optimistic bookmark toggle) rendered in the overview header via the `actions` slot; payload carries `isBookmarked`.
- Attendance disclaimer banner: blue info banner rendered once in `LectureDetailChrome` (below the overview header), so it appears on every lecture detail view (live/video, before/after, with/without recording). Which variant shows is decided by the pure `resolveLectureAttendanceBanner(attendance, watchPercentage)` (`src/lib/lecture-attendance/resolveLectureAttendanceBanner.ts`) — a documented rule table ported from legacy `AttendanceDisclaimer`. Two variants: `video-counts` ("…status will change to Present after 24 hours.") when `includeVideoAttendance` is set, `live-only` ("…Only live class attendance will be counted.") otherwise. No banner when attendance is null (optional/recommended), UI state is `null`/`hidden`, or the student is mid-watch while recording counts (`continue_watching` + `includeVideoAttendance` — the catch-up progress bar shows instead). Copy + `data-testid`s live in `LECTURE_ATTENDANCE_BANNERS`; view is `LectureAttendanceBanner`.
- AI "Ask" chat (desktop): opened from the in-player controls "Ask AI" pill (`LectureVideoControlsToolbar`, dark-glass pill shared via `AskAiPill`). The chat docks to the **right of the video as a resizable split** — inline via `LectureDesktopVideoStage`, and in browser fullscreen via the same `LectureChatSidePanel` rendered inside the fullscreen root (`LectureReactPlayer`, which flips its layout to a row). A prominent draggable divider (`LectureChatResizeHandle`, pointer + Arrow keys) sets the video/chat width split, clamped so each keeps a usable width and persisted to localStorage `lecture-chat-width` (`useLectureChatWidth`); open/close animates via `useChatPanelReveal` (width + opacity, disabled mid-drag). Open state is shared via `LectureSplitChatContext` / `useLectureSplitChatOpen` (localStorage `lecture-split-chat-open`). Mobile keeps the below-hero dock (`LectureAiChatExperience variant="mobile-dock"`). The old `LectureVideoAskAiPill`, the floating-popup launcher, and the fixed shrink-to-sidebar layout are removed.
- Feedback: `LectureFeedbackForm` (1–5 stars + text) rendered above the tabs. Payload carries `feedback: { canSubmit, rating, text }`. Window opens `schedule + 15min`, closes `concludes + 24h`, gated by `settings.show_feedback`; enforced again server-side on submit. Closed window with an existing rating shows a read-only summary; closed + unrated renders nothing.

## Test files

- `src/components/features/learn/LearnPageDetails/lecture/constants/__tests__/lectureSplitLayout.test.ts` — floating chat closed by default; stable storage key
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/useLectureSplitChatOpen.test.ts` — floating popup open state + localStorage persistence
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/useLectureChatWidth.test.ts` — chat panel width: default, keyboard nudge + persistence, min/video clamps, restore from storage
- `src/components/features/lecture-ai-chat/components/__tests__/LectureAiChatPanel.test.tsx` — header controls incl. maximize/minimize expand toggle, close, new-chat, history view, loading + feedback states
- `src/components/features/learn/LearnPageDetails/lecture/video/controls/__tests__/LectureVideoControlsToolbar.test.tsx` — no inline Ask pill; play activity + fullscreen toggle event
- `src/components/features/learn/LearnPageDetails/lecture/components/__tests__/LectureDesktopVideoStage.test.tsx` — full-width video + floating launcher; opens popup; restores open from storage
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/lectureViewportLayout.test.ts` — first-viewport hero height reserves title, chat, and tab rows
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/lectureChatDockLayout.test.ts` — inline chat docks only after scroll, not when below the fold
- `src/server/learn/utils/__tests__/parseLectureSettings.test.ts`
- `src/server/learn/utils/__tests__/resolveLectureVideoUrl.test.ts`
- `src/server/learn/utils/__tests__/resolveLiveLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/resolveVideoLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/toLectureScopedAdaptiveLink.test.ts` — adaptive (SAL) link lecture-scoping rewrite + passthrough
- `src/server/learn/utils/__tests__/zoomRedirectionToken.test.ts` — local ZEF token minting (group resolution, admin email mapping, validation, secret)
- `src/server/learn/services/__tests__/zoomRedirect.service.test.ts` — ZEF url build (Masai/iHub host, user/token failure mapping)
- `src/server/api/learn/handlers/__tests__/zoomRedirect.handler.test.ts` — ZEF REST handler (auth, id, 503)
- `src/lib/api/learn/__tests__/zoomRedirectApi.test.ts` — ZEF client wrapper
- `src/components/features/learn/LearnPageDetails/lecture/live/__tests__/JoinLiveSessionCard.test.tsx` — join button: direct anchor vs ZEF fetch+open, Zoom Web View embed link, adaptive/ZEF precedence, fallback, hidden/disabled states
- `src/server/learn/utils/__tests__/resolveEnableZoomWebView.test.ts` — `sections.settings.enableZoomWebView` strict-boolean narrowing
- `src/lib/learn/__tests__/zoomWebView.test.ts` — `buildZoomWebViewUrl` (old-LMS embed URL; null when base unresolved)
- `src/server/learn/utils/__tests__/scrubZoomLinkForSchedule.test.ts`
- `src/server/learn/utils/__tests__/buildLectureDetailPayload.test.ts`
- `src/server/learn/utils/__tests__/buildLectureTabContent.test.ts` — AI summary surfacing + transcript JSON parsing (incl. numeric strings)
- `src/server/learn/utils/__tests__/formatLectureTranscript.test.ts` — transcript segment parser tolerates string-typed `start`/`end`
- `src/server/learn/__tests__/getLectureLearningDetail.service.test.ts`
- `src/components/features/learn/LearnPageDetails/lecture/tabs/constants/__tests__/resolveVisibleLectureDetailTabs.test.ts` — single Description tab; hide_notes hides it; default-tab fallback
- `src/server/api/learn/handlers/__tests__/storeLectureVideoProgress.handler.test.ts` — REST video-progress handler (auth, validation, ok/false)
- `src/lib/api/learn/__tests__/videoProgressApi.test.ts` — video-progress client wrapper (POST body, graceful failure)
- `src/components/features/learn/LearnPageDetails/lecture/shared/__tests__/LectureDetailActions.test.tsx` — header Raise Ticket + optimistic bookmark toggle
- `src/server/api/learn/handlers/__tests__/lectureBookmark.handler.test.ts` — REST lecture bookmark add/remove handler
- `src/lib/api/learn/__tests__/learnApiBookmark.test.ts` — lecture bookmark client wrappers
- `src/server/learn/utils/__tests__/resolveLectureFeedbackWindow.test.ts` — feedback window open/close boundaries
- `src/server/learn/services/__tests__/lectureFeedback.service.test.ts` — get + windowed upsert (insert/update, access, closed)
- `src/server/api/learn/handlers/__tests__/submitLectureFeedback.handler.test.ts` — REST feedback handler (auth, rating range, closed→409)
- `src/lib/api/learn/__tests__/lectureFeedbackApi.test.ts` — feedback client wrapper
- `src/components/features/learn/LearnPageDetails/lecture/feedback/__tests__/LectureFeedbackForm.test.tsx` — windowed form (editable / read-only / hidden, submit)
- `src/components/features/learn/LearnPageDetails/lecture/tabs/__tests__/ExpandableTabContent.test.tsx` — fixed-height clamp + Show more / Show less toggle for every lecture tab
- `src/server/attendance/**/__tests__/*`
- `src/lib/lecture-attendance/**/__tests__/*`
- `src/components/features/learn/attendance/*`
- `src/lib/lecture-attendance/__tests__/resolveLectureAttendanceBanner.test.ts` — banner rule table (null/hidden gating, video-counts vs live-only, mid-watch suppression, local watch % override)
- `src/components/features/learn/attendance/__tests__/LectureAttendanceBanner.test.tsx` — banner renders variant copy + testid
- `src/components/features/learn/LearnPageDetails/lecture/live/utils/__tests__/resolveJoinLiveButtonState.test.ts`

## Lecture discussions UI

- `LectureDiscussionsSection` — title + description composer, inline discussion list with expand/collapse replies
- `LectureDiscussionCreateForm`, `LectureDiscussionListItem`, `LectureDiscussionReplyForm`
- Mutations call REST clients `createLearnDiscussionViaApi` / `addLearnDiscussionReplyViaApi` (`src/lib/api/learn/discussionsApi.ts`)
- `src/server/new-discussions/services/checkIfValidQuery.ts` — LLM public/private on create
- `src/server/new-discussions/services/__tests__/checkIfValidQuery.test.ts`
- `src/server/new-discussions/services/__tests__/createDiscussionForLearnEntity.test.ts`
- `src/server/api/learn/handlers/__tests__/createLearnDiscussion.handler.test.ts` — REST create handler (auth, payload, forbidden→403)
- `src/server/api/learn/handlers/__tests__/addLearnDiscussionReply.handler.test.ts` — REST reply handler (auth, validation, not-found/closed)
- `src/lib/api/learn/__tests__/discussionsApi.test.ts` — discussion REST client wrappers

## Commands

- `npm run test -- src/server/learn`
- `npm run test -- src/components/features/learn/LearnPageDetails/lecture/live/utils`
