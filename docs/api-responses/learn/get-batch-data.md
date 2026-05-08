# getBatchLearningData API Response Contract

## API Name
`getBatchLearningData`

## Purpose
Returns learn page data for the selected batch (lectures, assignments, resources, pagination, filters, etc.).

## Endpoint
`TBD` (learn batch data endpoint)

## Method
`GET`

## Request

### Path Params
None

### Query Params
None (TanStack ServerFn input object)

### Body
```json
{
  "batchId": 123,
  "learningType": "lecture",
  "search": "react",
  "page": 1,
  "pageSize": 10,
  "filters": {
    "modules": ["Module 1"],
    "categories": ["coding"],
    "types": ["live"],
    "priorities": ["recommended"],
    "instructors": ["Ananya Singh"]
  }
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
