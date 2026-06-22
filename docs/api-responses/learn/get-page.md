# GET `/api/learn/page`

Single source for the `/learn` page: enrolled batches + the resolved batch's listing
(lectures / assignments / resources) in one response. Replaces the former
`/api/learn/batches` and `/api/learn/batch-data` endpoints.

- Handler: `src/server/api/learn/handlers/getLearnPageData.handler.ts`
- Service: `src/server/learn/services/getLearnPageData.service.ts`
- Query parser: `src/server/api/learn/utils/parseLearnPageQuery.ts`
- Client: `fetchLearnPageDataFromApi` in `src/lib/api/learn/learnApi.ts`; called by the
  `/learn` route loader (re-runs on any search-param change).

## Behaviour

- `batchId` optional → server picks the requested enrolled batch, else the first
  enrolled batch (`selectedBatchId` in the response). The client still passes `batchId`
  so the localStorage last-batch preference wins.
- Listing filtering + pagination run in SQL; `pageSize` defaults to **25** (legacy LMS).
- Schedule visibility, date-range cap-at-today, attendance-forces-mandatory, and
  assignment progress all follow legacy LMS rules (see
  `docs/testing/features/learn-listing.md`).

See `rest-endpoints.md` for the full query-param table, response shape, and error codes.
