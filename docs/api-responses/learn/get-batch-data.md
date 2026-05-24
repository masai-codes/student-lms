# getBatchLearningData API Response Contract

## API Name
`getBatchLearningData`

## Purpose
Returns learn page data for the selected batch (lectures, assignments, resources, pagination, filters, etc.).

## Endpoint
`GET /api/learn/batch-data`

## Method
`GET`

## Request

### Path Params
None

### Query Params
| Param | Required | Description |
|-------|----------|-------------|
| `batchId` | yes | Batch id |
| `learningType` | yes | `lecture` \| `assignment` \| `resource` |
| `search` | no | Search string |
| `page`, `pageSize` | no | Pagination |
| `filters` | no | URL-encoded JSON of filter object (see below) |

Example: `/api/learn/batch-data?batchId=123&learningType=lecture&page=1&pageSize=10&filters=%7B%22modules%22%3A%5B%22Module%201%22%5D%7D`

Filter object shape:
```json
{
  "modules": ["Module 1"],
  "categories": ["coding"],
  "types": ["live"],
  "priorities": ["recommended"],
  "instructors": ["Ananya Singh"],
  "scheduleStartDate": "2026-05-01",
  "scheduleEndDate": "2026-05-31"
}
```

## Response

### Success Response
```json
{
  "filterValues": {
    "moduleFilterValues": ["Module 1", "Module 2"],
    "categoryFilterValues": ["coding", "project"],
    "typeFilterValues": ["live", "reading"],
    "priorityFilterValues": ["mandatory", "recommended"],
    "instructorFilterValues": ["Ananya Singh", "Rohit Verma"]
  },
  "learningItems": [
    {
      "id": 12345,
      "learningType": "lecture",
      "title": "React State Management",
      "hostName": "Ananya Singh",
      "scheduleDate": "2026-05-10 10:00:00",
      "type": "live",
      "category": "coding",
      "isOptional": "recommended",
      "moduleName": "Module 1"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
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
- `learningType` behavior:
  - `lecture` => lectures where `type != "reading"`
  - `resource` => lectures where `type == "reading"`
  - `assignment` => assignments table
- Search and filters are applied before pagination.
- Filter value arrays are unique values derived from the filtered dataset before pagination.
- Instructor values are resolved from `users.name` using `host_id` (lectures) and `user_id` (assignments).
- `moduleName` is currently derived as `Module <week>` because schema has `week` on both tables.
