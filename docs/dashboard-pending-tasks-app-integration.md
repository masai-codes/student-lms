# Dashboard Pending Tasks - App Integration Guide

Use this when integrating the new pending-only dashboard endpoint in the app.

## Endpoint

```
GET https://learn.masaischool.com/api/dashboard/pending-tasks
```

This endpoint returns only the dashboard pending-tasks feed:

```json
{
  "pendingTasks": []
}
```

It reuses the same backend logic as dashboard overview's `pendingTasks` field.

## Auth

This endpoint is session-authenticated.

- If the app already has a valid LMS session cookie, call the endpoint directly.
- If your app bootstraps LMS auth before opening web content, use the same session/bootstrap flow you already use for other authenticated LMS surfaces.
- Unauthenticated requests return `401`.

## What counts as a pending task

The response contains a flat list of:

1. Assignments that are still open and not yet begun by the learner
2. Mandatory lectures whose catch-up window is still open

The list is already filtered and sorted by the backend:

- scoped to the learner's sections
- paused / restricted content filtered out
- most urgent first
- empty array when there is nothing pending

## Response type

Use this TypeScript shape in the app:

```ts
export type DashboardPendingTasksResponse = {
  pendingTasks: DashboardPendingTaskItem[]
}

export type DashboardPendingTaskItem = {
  id: number
  learningType: 'lecture' | 'assignment' | 'resource'
  title: string
  hostName: string
  scheduleDate: string | null
  concludes: string | null
  type: string
  category: string
  isOptional: 'recommended' | 'mandatory'
  moduleName: string
  attendance: LectureAttendanceSummary | null
  optionalAttendance: LectureAttendanceSummary | null
  assignmentProgressStatus:
    'new' | 'in-progress' | 'overdue' | 'completed' | null
  resourcePhase: 'before' | 'during' | 'after' | null
  listingCtas: LearnListingCardCtas
  courseName: string | null
  enableZoomWebView: boolean
}

export type LectureAttendanceSummary = {
  overallStatus: number | null
  notApplicable: boolean
  hasStudentAttendanceEntry: boolean
  isCatchupWindowOver: boolean | null
  videoPercentage: number
  watchPercentage: number
  daysRemaining: number | null
  remainingLabel: string | null
  lateByMinutes: number | null
  liveAttendanceStatus: number
  videoAttendanceStatus: number
  includeVideoAttendance: boolean
  videoCountsForAttendance: boolean
}

export type LearnListingCardCtas = {
  joinLive: 'hidden' | 'disabled' | 'active'
  joinZoomLink: string | null
  isNewZoomRedirection: boolean
  enableZoomWebView: boolean
  showAttendance: boolean
  assignmentStatusChip:
    'new' | 'in-progress' | 'overdue' | 'completed' | 'practice-mode' | null
  assignmentDeadlineLabel: string | null
  assignmentScore: number | null
}
```

## Important notes for the app

- `pendingTasks` is already the final display list. No extra sorting is needed.
- `courseName` is only present when the learner is enrolled in more than one batch.
- `assignmentDeadlineLabel` is already server-computed, so the app can render it directly.
- `attendance.remainingLabel` / `attendance.daysRemaining` are useful for catch-up lecture UI.
- `resourcePhase` is included for shape parity with shared learn-card types, but for this endpoint current items are pending assignments or lectures.

## Sample response

```json
{
  "pendingTasks": [
    {
      "id": 12345,
      "learningType": "assignment",
      "title": "Sprint 3 Evaluation",
      "hostName": "Masai School",
      "scheduleDate": "2026-07-27T10:00:00+05:30",
      "concludes": "2026-07-29T23:59:00+05:30",
      "type": "assignment",
      "category": "assignment",
      "isOptional": "mandatory",
      "moduleName": "Frontend",
      "attendance": null,
      "optionalAttendance": null,
      "assignmentProgressStatus": "new",
      "resourcePhase": null,
      "listingCtas": {
        "joinLive": "hidden",
        "joinZoomLink": null,
        "isNewZoomRedirection": false,
        "enableZoomWebView": false,
        "showAttendance": false,
        "assignmentStatusChip": "new",
        "assignmentDeadlineLabel": "2 days remaining",
        "assignmentScore": null
      },
      "courseName": "SDE Batch 42",
      "enableZoomWebView": false
    }
  ]
}
```

## Suggested app fetch helper

```ts
export async function fetchDashboardPendingTasks(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/dashboard/pending-tasks`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Pending tasks request failed: ${response.status}`)
  }

  return (await response.json()) as DashboardPendingTasksResponse
}
```

## Expected status codes

- `200` - success
- `401` - unauthenticated
- `500` - unexpected server error
