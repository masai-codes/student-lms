import { createLecture, createLecturesAi } from '../../factories'

import type { CreateLectureOverrides } from '../../factories/createLecture'
import type { lectures, lecturesAi } from '@/db/schema'

type LectureRow = typeof lectures.$inferSelect
type LecturesAiRow = typeof lecturesAi.$inferSelect

export type OperatorsLectureSeed = {
  lecture: LectureRow
  lecturesAi: LecturesAiRow
}

const OPERATORS_NOTES = [
  '## Session notes',
  '',
  'Seeded lecture on **operators in JavaScript**.',
  '',
  '- Arithmetic, comparison, logical, and assignment operators',
  '- The ternary operator and `typeof`',
  '- Nullish coalescing (`??`) vs logical OR (`||`)',
].join('\n')

const OPERATORS_SUMMARY = [
  '## AI summary',
  '',
  'This lecture introduces the core operator categories in JavaScript: arithmetic,',
  'comparison, logical, assignment, the ternary operator, `typeof`, and nullish coalescing.',
  '',
  '**Key takeaways**',
  '1. Prefer `===`/`!==` over `==`/`!=` to avoid type-coercion surprises during comparisons.',
  '2. `&&` and `||` short-circuit, which is useful for guard checks and default values.',
  "3. `??` only falls back on `null`/`undefined`, unlike `||`, which also treats `0`, `''`, and `false` as missing.",
].join('\n')

const OPERATORS_TRANSCRIPT_SEGMENTS = [
  {
    id: 0,
    start: 0,
    end: 8,
    text: "Welcome back everyone. Today's session is all about operators in JavaScript.",
  },
  {
    id: 1,
    start: 8,
    end: 16,
    text: 'We will start with arithmetic operators: plus, minus, multiply, divide, modulo, and exponent.',
  },
  {
    id: 2,
    start: 16,
    end: 24,
    text: 'Next up are comparison operators — double equals, triple equals, and how loose versus strict equality actually differ.',
  },
  {
    id: 3,
    start: 24,
    end: 32,
    text: 'Then we cover logical operators: AND, OR, and NOT, and how they short-circuit.',
  },
  {
    id: 4,
    start: 32,
    end: 40,
    text: 'Assignment operators come next — the plain equals sign along with shorthand operators like plus-equals and minus-equals.',
  },
  {
    id: 5,
    start: 40,
    end: 48,
    text: "We will also look at the ternary operator as a compact if-else, and typeof for checking a value's type.",
  },
  {
    id: 6,
    start: 48,
    end: 56,
    text: 'Finally, the nullish coalescing operator, which only falls back when a value is null or undefined, not just falsy.',
  },
  {
    id: 7,
    start: 56,
    end: 64,
    text: "Let's jump into the code editor and try each of these operators live.",
  },
] as const

/**
 * Short "Operators in JavaScript" recording lecture with a small transcript
 * (plain text + timestamped segments) and a published AI summary.
 * `lectureDefaults` carries the caller's shared video/recording fields and
 * scheduling, so this lands in the same past-lecture phase as the other
 * recordings in the flow.
 */
export async function seedOperatorsLecture(
  flowId: string,
  lectureDefaults: CreateLectureOverrides,
): Promise<OperatorsLectureSeed> {
  const lecture = await createLecture({
    ...lectureDefaults,
    title: 'Operators in JavaScript',
    description: [
      `Seed flow: ${flowId}`,
      'Phase: after — recording playable, AI summary + transcript seeded.',
      'Covers arithmetic, comparison, logical, and assignment operators, the ternary operator, typeof, and nullish coalescing.',
    ].join('\n'),
    notes: OPERATORS_NOTES,
    optional: 0,
  })

  const lecturesAiRow = await createLecturesAi({
    lectureId: lecture.id,
    transcript: OPERATORS_TRANSCRIPT_SEGMENTS.map(
      (segment) => segment.text,
    ).join('\n\n'),
    transcriptSegments: [...OPERATORS_TRANSCRIPT_SEGMENTS],
    summary: OPERATORS_SUMMARY,
    isSummaryPublished: 1,
  })

  return { lecture, lecturesAi: lecturesAiRow }
}
