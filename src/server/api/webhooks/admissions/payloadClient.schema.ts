import { z } from 'zod'

/**
 * The optional `client` admissions sends alongside `enrolment_id` on the cancel
 * and events webhooks. It scopes the enrolment lookup to students of that
 * client (`users.client`), so the same `enrolment_id` coming from two portals
 * can never resolve to the wrong student's `batch_user`.
 *
 * Deliberately *not* a `z.enum([...])` of the known clients: `users.client` is a
 * plain `varchar(20)` and new clients get added there without a deploy here. An
 * unrecognised value must behave like "no student of that client" — a 404
 * `ENROLMENT_NOT_FOUND` — instead of 400-ing the whole webhook.
 *
 * `.nullish()` because admissions serialises "not sent" as an explicit `null`;
 * both mean "don't filter by client" (the pre-`client` behaviour).
 */
export const payloadClientSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase())
  .nullish()
