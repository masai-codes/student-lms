# getEnrolledBatches API Response Contract

## API Name
`getEnrolledBatches`

## Purpose
Returns the list of batches the logged-in user is enrolled in.

## Endpoint
`TBD` (learn enrolled batches endpoint)

## Method
`GET`

## Request

### Path Params
None

### Query Params
None

### Body
None

## Response

### Success Response
```json
[
  {
    "batchId": "batch_123",
    "courseTitle": "Cohort Alpha - Full Stack"
  },
  {
    "batchId": "batch_456",
    "courseTitle": "Cohort Beta - Data Science"
  }
]
```

### Error Response
```json
{
  "message": "TBD",
  "code": "TBD"
}
```

## Notes
- Source logic:
  - Use `section_user` table to find all unique batches mapped to the current user (`userId`).
  - Read `courseTitle` from `batches.meta.courseTitle`; if missing/empty, fallback to `batches.name`.
- Response should include only 2 fields per batch:
  - `batchId`
  - `courseTitle`
