# Admissions Webhooks — Sample cURLs

Copy any block below into Postman (**Import → Raw text**) or run it in a terminal.

All webhooks are `POST`, expect a JSON body, and are authorized with the shared
secret in the **`x-api-key`** header (compared against `ADMISSIONS_API_KEY`).

Before using, replace:

- `BASE_URL` — dev server default is `http://localhost:3002` (check the port your
  `npm run dev` prints). Prod: the deployed origin.
- `YOUR_ADMISSIONS_API_KEY` — value of the `ADMISSIONS_API_KEY` env var.

Common failure responses:

- `401 WEBHOOK_UNAUTHORIZED` — wrong/missing `x-api-key`
- `503 WEBHOOK_NOT_ENABLED` — `ADMISSIONS_API_KEY` not set on the server
- `400 INVALID_ENROLMENT_PAYLOAD` — body failed validation
- A real `404` (e.g. `ENROLMENT_NOT_FOUND`, `BATCH_NOT_FOUND`,
  `ADMISSION_DATA_NOT_FOUND`) is sent on the wire as **HTTP 422** with the true
  status in the `x-true-status` header (CloudFront-safe). The JSON `code` still
  tells you what happened.

---

## 1. Create enrolment

`POST /api/webhooks/admissions/create-enrolment`

Mandatory: `name`, `email`, `password`, `mobile`, `username`, `section_ids`
(≥1), `batch_id`, `enrolment_id`.
Conditional: `course_fee_deadline` is required when `new_user_journey` is `true`.
Everything else is optional.
Portal: `isiitj: true` stores the user under the `iitj` client, `isiHub: true`
under `ihub`; neither flag means `masai`.

Returns `{ userId, batchUserId, validSectionIds, invalidSectionIds }`.

### Full payload

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/create-enrolment' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "name": "Asha Rao",
    "email": "asha.rao@example.com",
    "password": "SuperSecret123",
    "mobile": "9998887776",
    "username": "asha_rao",
    "section_ids": [101, 102],
    "manager_id": 55,
    "batch_id": 42,
    "enrolment_id": 314294967295,
    "new_user_journey": true,
    "id_card_url": "https://cdn.example.com/id/asha.png",
    "seat_blocking_fees_paid": true,
    "seat_blocking_fees_amount": 5000,
    "seat_blocking_fees_paid_date": "2026-07-20 10:30:00",
    "seat_blocking_fees_invoice": "https://cdn.example.com/inv/sb-asha.pdf",
    "student_kit_exists": true,
    "course_fee_deadline": "2026-09-01 00:00:00",
    "payment_url": "https://pay.example.com/asha",
    "isiHub": false,
    "isiitj": false
  }'
```

### Minimal payload (mandatory fields only)

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/create-enrolment' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "name": "Asha Rao",
    "email": "asha.rao@example.com",
    "password": "SuperSecret123",
    "mobile": "9998887776",
    "username": "asha_rao",
    "section_ids": [101],
    "batch_id": 42,
    "enrolment_id": 314294967295
  }'
```

---

## 2. Cancel enrolment

`POST /api/webhooks/admissions/cancel-enrolment`

Soft-deletes the batch_user + all its section_users, sets the
`batchEnrolmentCancelled` restriction flag, and records the payload.
Returns `{ batchUserId, userId, batchId, cancelledSectionUserIds }`.

Optionally send `client` (`masai` / `ihub` / `iitj`, case-insensitive): the
enrolment is then only matched when the student's `users.client` equals it, so a
mismatch is a 404 `ENROLMENT_NOT_FOUND` instead of cancelling another portal's
enrolment that happens to share the id. Omitted or `null` = match any client.

Optionally send `batch_id` too: only `batch_user` rows in that batch can then
match. Use it when one `enrolment_id` maps to several rows (re-enrolment,
transfer) and you need a specific batch cancelled — without it the newest row by
`created_at` wins. A batch that has no row for this enrolment is likewise a 404
`ENROLMENT_NOT_FOUND`. Omitted or `null` = match any batch.

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/cancel-enrolment' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "enrolment_id": 314294967295,
    "client": "iitj",
    "batch_id": 4821
  }'
```

---

## 2b. Undo cancel enrolment

`POST /api/webhooks/admissions/undo-cancel-enrolment`

Reverses a cancel: clears the batch_user's soft-delete, puts it back to
`active`, drops the `batchEnrolmentCancelled` restriction flags, and revives the
section_users that cancel soft-deleted. Returns
`{ batchUserId, userId, batchId, revivedSectionUserIds, alreadyActive }`.

Body is **identical to cancel-enrolment** — `enrolment_id` plus the same optional
`client` / `batch_id` scopes, resolved by the same lookup, so undo addresses the
exact row a cancel with the same payload would have.

Only section_users whose last `meta.history` entry is `cancelled` are revived: a
section_user has no status column, so this is what separates rows a cancel
removed from rows an admin or a transfer removed. Replaying the webhook is a
no-op — an already-live batch_user returns `alreadyActive: true` and writes
nothing.

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/undo-cancel-enrolment' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "enrolment_id": 314294967295,
    "client": "iitj",
    "batch_id": 4821
  }'
```

---

## 3. Batch events (unified)

`POST /api/webhooks/admissions/events`

One endpoint for all batch lifecycle events. The envelope `type` selects the
action; `data.enrolment_id` locates the enrolment; the **whole envelope** is
stored in the batch_user audit trail. Returns `{ event, batchUserId }`.

Supported `type` values:

| `type`                          | Effect                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `lms.batch.paid`                | Marks `full_fees_paid = true` on admission data (no payload flag needed). 404 `ADMISSION_DATA_NOT_FOUND` if that row is missing. |
| `lms.batch.transfer.considered` | `batch_transfer_id = data.to_batch_id`, status `considered`                                                                      |
| `lms.batch.transfer.rejected`   | …status `rejected`                                                                                                               |
| `lms.batch.transfer.completed`  | …status `completed`                                                                                                              |
| `lms.batch.pause`               | Sets `batchPaused` / `batchPausedDate` in meta                                                                                   |
| `lms.batch.unpause`             | Removes `batchPaused` / `batchPausedDate` from meta                                                                              |
| `lms.invoice.generated`         | Sets `full_fees_paid_invoice` on admission data (needs `data.full_fees_paid_invoice`). 404 if that row is missing                |
| `lms.fee.deadline.updated`      | Sets `course_fee_deadline` on admission data (needs `data.course_fee_deadline`). 404 if that row is missing                      |

Only `type` + `data.enrolment_id` are needed (transfer events also need
`data.to_batch_id`). Optionally send `data.lms_batch_user_id` — when one
`enrolment_id` maps to several `batch_user` rows it selects that exact row;
without it, the latest-created row is used. Optionally send `data.client`
(`masai` / `ihub` / `iitj`, case-insensitive) — the enrolment then only matches
when the student's `users.client` equals it, otherwise the event 404s with
`ENROLMENT_NOT_FOUND`; it is applied before `lms_batch_user_id`, so that id can
only ever pick among the client's own rows. Any other fields the platform sends
are ignored by the logic but still stored verbatim in the audit trail — the
samples below show just the required keys.

`null` counts as "not sent" for every optional field, so an envelope carrying
`"full_fees_paid_invoice": null` / `"course_fee_deadline": null` /
`"lms_batch_user_id": null` is accepted. The fields a specific event _requires_
(`to_batch_id` for transfers, `full_fees_paid_invoice` for
`lms.invoice.generated`, `course_fee_deadline` for `lms.fee.deadline.updated`)
must still be a real value there — `null` is a 400 for those.

### `lms.batch.paid` (also `lms.batch.pause` / `lms.batch.unpause`)

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/events' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "type": "lms.batch.paid",
    "data": { "enrolment_id": 314294967295, "client": "iitj" }
  }'
```

### `lms.batch.transfer.considered` (also `.rejected` / `.completed`)

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/events' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "type": "lms.batch.transfer.considered",
    "data": {
      "enrolment_id": 314294967295,
      "to_batch_id": 22
    }
  }'
```

### `lms.invoice.generated`

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/events' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "lms.invoice.generated",
    "data": {
      "enrolment_id": 314294967295,
      "full_fees_paid_invoice": "https://cdn.example.com/inv/full-asha.pdf"
    }
  }'
```

### `lms.fee.deadline.updated`

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/events' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "lms.fee.deadline.updated",
    "data": {
      "enrolment_id": 314294967295,
      "course_fee_deadline": "2026-09-01 00:00:00"
    }
  }'
```
