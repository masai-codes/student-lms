# Learn REST API

Base path: `/api/learn` (same origin as the student LMS app). All endpoints require a valid session cookie unless noted.

## GET `/api/learn/batches`

Enrolled batches for the current user (learn page header).

### Success `200`
```json
{
  "batches": [
    {
      "batchId": 133,
      "courseTitle": "Full Stack Web",
      "courseLogo": "https://example.com/logo.png"
    }
  ]
}
```

### Errors
| Status | code |
|--------|------|
| 401 | `UNAUTHORIZED` |
| 500 | `SERVER_ERROR_FETCHING_ENROLLED_BATCHES` |

---

## GET `/api/learn/batch-data`

Paginated learn listing for a batch (lectures, assignments, or resources tab).

### Query
| Param | Required | Description |
|-------|----------|-------------|
| `batchId` | yes | Batch id |
| `learningType` | yes | `lecture` \| `assignment` \| `resource` |
| `search` | no | Title/host search |
| `page` | no | Page number (default 1) |
| `pageSize` | no | Page size (default 10, max 50) |
| `filters` | no | JSON string of `BatchLearningFiltersInput` |
| `modules`, `categories`, `types`, `priorities`, `instructors` | no | Comma-separated filter lists |
| `scheduleStartDate`, `scheduleEndDate` | no | `yyyy-mm-dd` |

### Success `200`
Same shape as `GetBatchLearningDataResponse` in `src/server/learn/types.ts`.

### Errors
| Status | code |
|--------|------|
| 400 | `MISSING_BATCH_ID`, `INVALID_LEARNING_TYPE`, `INVALID_FILTERS_JSON` |
| 401 | `UNAUTHORIZED` |
| 500 | `SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA` |

---

## GET `/api/learn/lectures/:lectureId`

Full lecture detail payload for the detail page (single response).

### Success `200`
`LectureDetailPayload` from `src/server/learn/lectureDetailTypes.ts`.

### Errors
| Status | code |
|--------|------|
| 400 | `INVALID_LECTURE_ID` |
| 401 | `UNAUTHORIZED` |
| 404 | `LEARN_DETAIL_NOT_FOUND` |

---

## GET `/api/learn/assignments/:assignmentId`

### Success `200`
`AssignmentDetailPayload` from `src/server/learn/assignmentDetailTypes.ts`.

### Errors
| Status | code |
|--------|------|
| 400 | `INVALID_ASSIGNMENT_ID` |
| 401 | `UNAUTHORIZED` |
| 404 | `LEARN_DETAIL_NOT_FOUND`, `ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE` |

---

## GET `/api/learn/resources/:resourceId`

### Success `200`
`ResourceDetailPayload` from `src/server/learn/resourceDetailTypes.ts`.

### Errors
| Status | code |
|--------|------|
| 400 | `INVALID_RESOURCE_ID` |
| 401 | `UNAUTHORIZED` |
| 404 | `LEARN_DETAIL_NOT_FOUND`, `RESOURCE_DETAIL_UNSUPPORTED_TYPE` |
