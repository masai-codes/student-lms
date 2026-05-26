# getEnrolledBatches API Response Contract

## API Name
`getEnrolledBatches`

## Purpose
Returns the list of batches the logged-in user is enrolled in.

## Endpoint
`GET /api/learn/batches`

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
{
  "batches": [
    {
      "batchId": 123,
      "courseTitle": "Cohort Alpha - Full Stack",
      "courseLogo": null
    }
  ]
}
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
