# Migration APIs — Sample cURLs

One-off, operator-run endpoints that patch data in the DB. They are **not** called
by the app or by any external system — you call them by hand from Postman or a
terminal when a record needs fixing.

Copy any block below into Postman (**Import → Raw text**) or run it in a terminal.

All migration endpoints are `POST`, expect a JSON body, and are authorized with
the **`x-migration-token`** header (compared against the `SECRET_LOGIN_TOKEN` env
var). Treat that token as a secret — never paste it into a shared doc or commit it.

Before using, replace:

- `BASE_URL` — dev server default is `http://localhost:3002` (check the port your
  `npm run dev` prints). Prod: the deployed origin.
- `YOUR_SECRET_LOGIN_TOKEN` — value of the `SECRET_LOGIN_TOKEN` env var (in
  `.env.local` for dev).

Common failure responses:

- `401 MIGRATION_UNAUTHORIZED` — wrong/missing `x-migration-token`
- `503 MIGRATION_NOT_ENABLED` — `SECRET_LOGIN_TOKEN` not set on the server
- `400 INVALID_MIGRATION_PAYLOAD` — body failed validation
- A real `404` (e.g. `BATCH_USER_NOT_FOUND`) is sent on the wire as **HTTP 422**
  with the true status in the `x-true-status` header — see
  `src/lib/api/cloudFrontSafeStatus.ts`. The JSON `code` is always the real one.

---

## Set `batch_user.enrolment_id`

Finds the live (non-soft-deleted) `batch_user` row for a `(batch_id, user_id)`
pair and writes `enrolment_id` onto it.

```bash
curl -i -X POST 'BASE_URL/api/migrations/batch-user/set-enrolment-id' \
  -H 'Content-Type: application/json' \
  -H 'x-migration-token: YOUR_SECRET_LOGIN_TOKEN' \
  -d '{
    "batch_id": 123,
    "user_id": 45678,
    "enrolment_id": 9876543210
  }'
```

Success (`200`):

```json
{
  "batchUserId": 55555,
  "batchId": 123,
  "userId": 45678,
  "previousEnrolmentId": null,
  "enrolmentId": 9876543210,
  "updated": true
}
```

Re-running with the same `enrolment_id` is a no-op and returns `"updated": false`.

Endpoint-specific failures:

- `404 BATCH_USER_NOT_FOUND` — no live `batch_user` row for that batch/user pair
  (wire status 422, see above)
- `409 MULTIPLE_BATCH_USER_ROWS` — several live rows match, so the target is
  ambiguous; the message lists the `batch_user` ids. Resolve by hand.
- `409 ENROLMENT_ID_ALREADY_SET` — the row already holds a _different_
  `enrolment_id`. Re-send with `"overwrite": true` to replace it:

```bash
curl -i -X POST 'BASE_URL/api/migrations/batch-user/set-enrolment-id' \
  -H 'Content-Type: application/json' \
  -H 'x-migration-token: YOUR_SECRET_LOGIN_TOKEN' \
  -d '{
    "batch_id": 123,
    "user_id": 45678,
    "enrolment_id": 9876543210,
    "overwrite": true
  }'
```

---

## Adding a new migration endpoint

Follow the same route → handler → service split as the rest of the app:

1. `src/routes/api/migrations/<area>/<action>.ts` — file route, `POST` handler only.
2. `src/server/api/migrations/<area>/handlers/<action>.handler.ts` — call
   `verifyMigrationToken(request)` first, parse the body with a zod schema, throw
   `ApiError`, return via `jsonOk` / `mapThrownErrorToResponse`.
3. `src/server/api/migrations/<area>/<action>.schema.ts` — zod payload schema.
4. `src/server/api/migrations/<area>/<action>.service.ts` — the DB work. Log the
   before/after values with `logger` so the change is auditable.
5. Document it in this file.
