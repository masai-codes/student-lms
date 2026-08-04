import { z } from 'zod'

// Practical email check (non-empty local part @ domain . tld) applied on top of Zod.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Payload the admissions platform sends to the create-enrolment webhook.
 *
 * Field-level rules:
 * - `section_ids` must contain at least one id.
 * - `email` must match `EMAIL_REGEX` and is normalized to lowercase.
 * - `course_fee_deadline` becomes mandatory when `new_user_journey` is true
 *   (enforced by the cross-field refine below).
 *
 * Every optional field is `.nullish()`, not `.optional()`: admissions serialises
 * "no value" as an explicit `null`, and a `null` on a field we would have
 * defaulted anyway is not worth a 400. Consumers already normalise with
 * `?? null` / `!= null`.
 */
export const createEnrolmentSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z
      .string()
      .trim()
      .regex(EMAIL_REGEX)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1),
    mobile: z.string().trim().min(1),
    username: z.string().trim().min(1),
    section_ids: z.array(z.number().int().positive()).min(1),
    manager_id: z.number().int().positive().nullish(),
    batch_id: z.number().int().positive(),
    enrolment_id: z.number().int().positive(),
    new_user_journey: z.boolean().nullish(),
    id_card_url: z.string().trim().min(1).nullish(),
    seat_blocking_fees_paid: z.boolean().nullish(),
    seat_blocking_fees_amount: z.number().nonnegative().nullish(),
    seat_blocking_fees_paid_date: z.string().trim().min(1).nullish(),
    seat_blocking_fees_invoice: z.string().trim().min(1).nullish(),
    student_kit_exists: z.boolean().nullish(),
    course_fee_deadline: z.string().trim().min(1).nullish(),
    payment_url: z.string().trim().min(1).nullish(),
    isiHub: z.boolean().nullish(),
    isiitj: z.boolean().nullish(),
  })
  .refine(
    (data) => !data.new_user_journey || Boolean(data.course_fee_deadline),
    {
      path: ['course_fee_deadline'],
      message: 'course_fee_deadline is required when new_user_journey is true',
    },
  )

export type CreateEnrolmentInput = z.infer<typeof createEnrolmentSchema>
