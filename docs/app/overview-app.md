# App: `GET /api/dashboard/overview-app`

Slim dashboard payload for the **mobile app** home screen. Prefer this over
`GET /api/dashboard/overview` — the full overview also returns welcome banners,
announcements, product updates, support sessions, schedule, T0 flow, fee banners,
etc. that the app does not need on this screen.

## Endpoint

|              |                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------- |
| Method       | `GET`                                                                                    |
| Path         | `/api/dashboard/overview-app`                                                            |
| Auth         | Session cookie (same as other protected LMS APIs). Unauthenticated → `401 UNAUTHORIZED`. |
| Success      | `200` + JSON body below                                                                  |
| Server error | `500` with `code: "SERVER_ERROR_FETCHING_DASHBOARD_OVERVIEW_APP"`                        |

Typed client helper (web LMS): `fetchDashboardOverviewApp()` in
`src/lib/api/dashboard/dashboardApi.ts`.

## Response shape

```ts
interface DashboardOverviewApp {
  pendingTasks: DashboardScheduleItem[]
  batchTransferPaymentBanners: BatchTransferPaymentBanner[]
  batchStartBanners: BatchStartBanner[]
}
```

Every array is always present. When nothing qualifies, it is `[]` — never
`null` / omitted.

---

### 1. `pendingTasks: DashboardScheduleItem[]`

Open assignments the learner has not begun + mandatory lectures whose catch-up
window is still open, sorted by urgency (least time remaining first).

`DashboardScheduleItem` extends the shared learn listing card shape:

```ts
interface DashboardScheduleItem {
  // --- LearningItem fields ---
  id: number
  learningType: 'lecture' | 'assignment' | 'resource'
  title: string
  hostName: string
  scheduleDate: string | null // IST wall-clock start
  concludes: string | null // IST wall-clock end
  type: string
  category: string
  isOptional: 'recommended' | 'mandatory'
  moduleName: string
  attendance: LectureAttendanceSummary | null // mandatory lectures
  optionalAttendance: LectureAttendanceSummary | null // optional lectures
  assignmentProgressStatus:
    | 'new'
    | 'in-progress'
    | 'overdue'
    | 'completed'
    | null
  assignmentWeightage: number | null
  resourcePhase: 'before' | 'during' | 'after' | null
  listingCtas: LearnListingCardCtas

  // --- dashboard-only ---
  courseName: string | null // only when user is in >1 batch; else null
  enableZoomWebView: boolean // sections.settings.enableZoomWebView
}
```

`LearnListingCardCtas` (server-resolved CTA flags):

```ts
interface LearnListingCardCtas {
  joinLive: 'hidden' | 'disabled' | 'active'
  joinZoomLink: string | null
  isNewZoomRedirection: boolean
  enableZoomWebView: boolean
  showAttendance: boolean
  assignmentStatusChip:
    | 'new'
    | 'in-progress'
    | 'overdue'
    | 'completed'
    | 'practice-mode'
    | null
  assignmentDeadlineLabel: string | null // e.g. "2 days remaining"
  assignmentScore: number | null
}
```

`LectureAttendanceSummary` (when present):

```ts
type LectureAttendanceSummary = {
  overallStatus: number | null // 0 absent, 1 present; null = no row yet
  notApplicable: boolean
  hasStudentAttendanceEntry: boolean
  isCatchupWindowOver: boolean | null
  videoPercentage: number
  watchPercentage: number
  daysRemaining: number | null
  remainingLabel: string | null // e.g. "2 days 3 hours remaining"
  lateByMinutes: number | null
  liveAttendanceStatus: number
  videoAttendanceStatus: number
  // …plus video-attendance tracking flags from the attendance module
}
```

**UI notes**

- Reuse the same card treatment as the web Pending Tasks tab / learn listing.
- Empty → hide the section or show a friendly empty state.

---

### 2. `batchTransferPaymentBanners: BatchTransferPaymentBanner[]`

One banner per `batch_user` whose transfer is `considered` and awaiting the
learner to finish the admissions process (payment / refund / confirm — copy stays
neutral).

```ts
interface BatchTransferPaymentBanner {
  batchUserId: number // stable key for list/carousel
  toBatchId: number // destination batch id
  courseTitle: string // destination course title (falls back to id string)
  paymentUrl: string | null // LMS redirect URL, or null when SSO is unconfigured
}
```

When `paymentUrl` is non-null it looks like:

```
/api/admissions/enrolment-payment-redirect?enrolmentId=<id>
```

### Auth for the Complete Process CTA (app)

The redirect route does **not** accept `Authorization: Bearer` alone from a
cold WebView unless a session cookie already exists. For the app, use the same
**bootstrap JWT** (`{ userId }`, signed with `JWT_SECRET_KEY` — same token you
already pass as `?token=` on protected LMS pages).

**Open a single URL** (same WebView / cookie jar):

```
https://<lms-host>/api/admissions/enrolment-payment-redirect?enrolmentId=<id>&token=<bootstrapJWT>
```

What happens:

1. **Token-first:** when `?token=` is present, LMS verifies it as a bootstrap JWT
   and mints a session (reusing the same `bootstrapLoginWithToken` as protected
   pages) — the token's user always wins over any existing cookie (so a stale
   `.masaischool.com` cookie for a different user can't hijack the flow). The
   `Set-Cookie` rides along on the 302, so the session is stored before the
   browser follows the redirect. If the token is missing/invalid, LMS falls back
   to the existing session cookie / `Authorization: Bearer`.
2. Enrolment must belong to that user and be a `considered` batch transfer.
3. LMS mints a **fresh admissions SSO** token and **302**s to
   `{ADMISSIONS_SSO_BASE_URL}/lms-login?token=…&enrolment_id=…`.

Do **not** put the bootstrap JWT into the admissions Location URL yourself —
only append it to the LMS `paymentUrl`. Web (already cookied) can open
`paymentUrl` as returned, without `&token=`.

When `paymentUrl` is `null`, render the banner but **disable** the CTA.

Suggested copy (matches web):

> Your batch transfer request to **{courseTitle}** has been considered. Please
> complete the process as soon as possible.

CTA label: **Complete Process**.

Empty `[]` → do not show the transfer banner strip.

---

### 3. `batchStartBanners: BatchStartBanner[]`

Upcoming enrolled batches (start date today or later, IST), soonest first, one
per batch.

```ts
interface BatchStartBanner {
  batchId: number
  courseTitle: string
  startDate: string // YYYY-MM-DD (IST)
  startDateLabel: string // e.g. "12 Aug 2026"
}
```

Suggested copy (matches web): course **{courseTitle}** will start on
**{startDateLabel}**.

Empty `[]` → do not show the start-banner strip.

---

## Sample response

```json
{
  "pendingTasks": [
    {
      "id": 42,
      "learningType": "assignment",
      "title": "Sprint 3 submission",
      "hostName": "Instructor",
      "scheduleDate": "2026-07-28 10:00:00",
      "concludes": "2026-08-05 23:59:59",
      "type": "coding",
      "category": "Full Stack",
      "isOptional": "mandatory",
      "moduleName": "React",
      "attendance": null,
      "optionalAttendance": null,
      "assignmentProgressStatus": "new",
      "assignmentWeightage": 10,
      "resourcePhase": null,
      "listingCtas": {
        "joinLive": "hidden",
        "joinZoomLink": null,
        "isNewZoomRedirection": false,
        "enableZoomWebView": false,
        "showAttendance": false,
        "assignmentStatusChip": "new",
        "assignmentDeadlineLabel": "5 days remaining",
        "assignmentScore": null
      },
      "courseName": null,
      "enableZoomWebView": false
    }
  ],
  "batchTransferPaymentBanners": [
    {
      "batchUserId": 101,
      "toBatchId": 2201,
      "courseTitle": "SDE-2",
      "paymentUrl": "/api/admissions/enrolment-payment-redirect?enrolmentId=998877"
    }
  ],
  "batchStartBanners": [
    {
      "batchId": 55,
      "courseTitle": "SDE-1",
      "startDate": "2026-08-12",
      "startDateLabel": "12 Aug 2026"
    }
  ]
}
```

## Empty / edge cases

| Situation                                               | Payload                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Nothing to show                                         | All three arrays are `[]`                                             |
| Transfer banner but SSO not configured                  | Banner present, `paymentUrl: null` → disable CTA                      |
| Single-batch learner                                    | `pendingTasks[*].courseName` is `null`                                |
| Unauthenticated overview                                | `401 { "code": "UNAUTHORIZED", "message": "UNAUTHORIZED" }`           |
| App opens `paymentUrl` without session                  | Append `&token=<bootstrapJWT>` — LMS sets cookie + 302s to admissions |
| App opens `paymentUrl` with bad/expired bootstrap token | 302 to `/` (home)                                                     |

## Source of truth

- Service: `src/server/api/dashboard/getDashboardOverviewApp.service.ts`
- Sub-services: `pending/getDashboardPendingTasks.service`,
  `getBatchTransferPaymentBanners.service`, `getBatchStartBanners.service`
- Types: `BatchTransferPaymentBanner`, `BatchStartBanner`,
  `DashboardScheduleItem` (extends `LearningItem` from `src/server/learn/types.ts`)
