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
    "isiHub": false
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

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/cancel-enrolment' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "enrolment_id": 314294967295
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
without it, the latest-created row is used. Any other fields the platform sends
are ignored by the logic but still stored verbatim in the audit trail — the
samples below show just the required keys.

### `lms.batch.paid` (also `lms.batch.pause` / `lms.batch.unpause`)

```bash
curl -X POST 'BASE_URL/api/webhooks/admissions/events' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_ADMISSIONS_API_KEY' \
  -d '{
    "type": "lms.batch.paid",
    "data": { "enrolment_id": 314294967295 }
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
