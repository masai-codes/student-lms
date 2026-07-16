# Learn REST API

Base path: `/api/learn` (same origin as the student LMS app). All endpoints require a valid session cookie unless noted.

## GET `/api/learn/page`

Single endpoint backing the `/learn` page — returns the enrolled batches **and** the
paginated listing for the resolved batch in one response (folds the former
`/api/learn/batches` + `/api/learn/batch-data`).

### Query

| Param                                                         | Required | Description                                                              |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `learningType`                                                | yes      | `lecture` \| `assignment` \| `resource`                                  |
| `batchId`                                                     | no       | Batch id; defaults to the first enrolled batch when omitted/not enrolled |
| `search`                                                      | no       | Title search                                                             |
| `page`                                                        | no       | Page number (default 1)                                                  |
| `pageSize`                                                    | no       | Page size (default 25, max 50)                                           |
| `modules`, `categories`, `types`, `priorities`, `instructors` | no       | Comma-separated filter lists                                             |
| `scheduleStartDate`, `scheduleEndDate`                        | no       | `yyyy-mm-dd` (end capped at today)                                       |
| `schedulePhase` / `lectureTab`                                | no       | `all` \| `upcoming` \| `past` (lectures/resources)                       |
| `attendanceStatus`                                            | no       | `present` \| `absent` (mandatory lectures only)                          |
| `assignmentProgress` / `assignmentTab`                        | no       | `new,in-progress,completed,overdue`                                      |
| `optional`                                                    | no       | `yes` (recommended) / `no` (mandatory) — legacy alias                    |

### Success `200`

`GetLearnPageDataResponse` in `src/server/learn/types.ts`:

```jsonc
{
  "batches": [
    {
      "batchId": 133,
      "courseTitle": "Full Stack Web",
      "courseLogo": null,
      "showAttendanceReport": false,
      "showEvaluationReport": false,
    },
  ],
  "selectedBatchId": 133,
  "filterValues": {
    "moduleFilterValues": [],
    "categoryFilterValues": [],
    "typeFilterValues": [],
    "priorityFilterValues": [],
    "instructorFilterValues": [],
  },
  "learningItems": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false,
  },
}
```

When the user has no enrolled batches, `selectedBatchId` is `null` and the listing is empty.

### Errors

| Status | code                                    |
| ------ | --------------------------------------- |
| 400    | `INVALID_LEARNING_TYPE`                 |
| 401    | `UNAUTHORIZED`                          |
| 500    | `SERVER_ERROR_FETCHING_LEARN_PAGE_DATA` |

---

## GET `/api/learn/lectures/:lectureId`

Full lecture detail payload for the detail page (single response).

### Success `200`

`LectureDetailPayload` from `src/server/learn/lectureDetailTypes.ts` (includes `attendance` for mandatory lectures).

### Errors

| Status | code                     |
| ------ | ------------------------ |
| 400    | `INVALID_LECTURE_ID`     |
| 401    | `UNAUTHORIZED`           |
| 404    | `LEARN_DETAIL_NOT_FOUND` |

---

## GET `/api/learn/assignments/:assignmentId`

### Success `200`

`AssignmentDetailPayload` from `src/server/learn/assignmentDetailTypes.ts`.

### Errors

| Status | code                                                           |
| ------ | -------------------------------------------------------------- |
| 400    | `INVALID_ASSIGNMENT_ID`                                        |
| 401    | `UNAUTHORIZED`                                                 |
| 404    | `LEARN_DETAIL_NOT_FOUND`, `ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE` |

---

## GET `/api/learn/resources/:resourceId`

### Success `200`

`ResourceDetailPayload` from `src/server/learn/resourceDetailTypes.ts`.

### Errors

| Status | code                                                         |
| ------ | ------------------------------------------------------------ |
| 400    | `INVALID_RESOURCE_ID`                                        |
| 401    | `UNAUTHORIZED`                                               |
| 404    | `LEARN_DETAIL_NOT_FOUND`, `RESOURCE_DETAIL_UNSUPPORTED_TYPE` |
