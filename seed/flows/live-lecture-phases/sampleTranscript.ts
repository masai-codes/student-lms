/**
 * Sample transcript fixtures for the `live-lecture-phases` flow.
 *
 * Long enough that the Transcript tab actually overflows its collapsed height
 * (so "Show more" and the Download button are both worth exercising), and split
 * into an opening block plus the closing minutes of the same 60-minute session —
 * the gap is deliberate, so QA sees both the `m:ss` and the hour-crossing
 * `h:mm:ss` timestamp formats in one transcript.
 */

export type SeedTranscriptSegment = {
  id: number
  start: number
  end: number
  text: string
}

const SEGMENT_SECONDS = 8

/** Where the closing block starts (59:36), so its tail crosses `1:00:00`. */
const CLOSING_START_SECONDS = 3576

const OPENING_LINES = [
  'Good evening everyone, and welcome back to JavaScript Fundamentals.',
  'Before we start, a quick recap of where we left off last session.',
  'We covered how the call stack works and why order of execution matters.',
  'Today we have three things on the agenda.',
  'First, closures. Second, the array methods you will reach for every day.',
  'And third, a short live coding exercise at the end.',
  'Let us start with closures, because they show up in almost every interview.',
  'A closure is simply a function that remembers the scope it was created in.',
  'So even after the outer function returns, the inner function can still read those variables.',
  'Let me put the classic counter example up on screen.',
  'Notice that count lives in the outer function, not inside the returned function.',
  'Every time we call the returned function it reads and updates that same count.',
  'That is the closure: the variable stays alive because something still references it.',
  'A common mistake is creating the counter inside a loop and expecting separate values.',
  'If you use var instead of let, every iteration ends up sharing one binding.',
  'Switch it to let and each iteration gets its own binding, which is usually what you want.',
  'Alright, that is closures. Moving on to array methods.',
  'map takes each element and returns a new array of the same length.',
  'filter keeps only the elements for which your callback returns true.',
  'reduce folds the whole array down into a single value.',
  'The important part is that none of the three mutate the original array.',
  'Let us apply all three to the small dataset in the shared repository.',
] as const

const CLOSING_LINES = [
  "That brings us to the end of today's session.",
  'To recap: closures capture their outer scope, and map, filter, and reduce never mutate.',
  'The practice assignment is linked under Associated Content on this page.',
  'Please attempt it before the next class so we can discuss your solutions.',
  'If you get stuck, post in the discussion thread below this lecture.',
  'Thanks for staying on, and I will see you all in the next session.',
] as const

/** Contiguous `SEGMENT_SECONDS`-long segments for `lines`, numbered from `firstId`. */
function buildSegments(
  startSeconds: number,
  firstId: number,
  lines: ReadonlyArray<string>,
): Array<SeedTranscriptSegment> {
  return lines.map((text, index) => {
    const start = startSeconds + index * SEGMENT_SECONDS
    return { id: firstId + index, start, end: start + SEGMENT_SECONDS, text }
  })
}

/** `lectures_ai.transcript_segments` for the segmented sample lecture. */
export const SAMPLE_TRANSCRIPT_SEGMENTS: Array<SeedTranscriptSegment> = [
  ...buildSegments(0, 0, OPENING_LINES),
  ...buildSegments(CLOSING_START_SECONDS, OPENING_LINES.length, CLOSING_LINES),
]

/** `lectures_ai.transcript` companion for the segmented sample lecture. */
export const SAMPLE_TRANSCRIPT_TEXT = SAMPLE_TRANSCRIPT_SEGMENTS.map(
  (segment) => segment.text,
).join('\n\n')

/**
 * Flat transcript for the lecture seeded *without* segments — the shape older
 * lectures have, and the fallback path of both the Transcript tab and its
 * download (no timestamps, plain paragraphs).
 */
export const SAMPLE_TRANSCRIPT_PLAIN_TEXT = [
  'Welcome back. This session is a walkthrough of the DOM APIs you will use in the next assignment, and there are no timestamped segments for it — the transcript was captured as plain text.',
  'We begin with querySelector and querySelectorAll, and why the second one returns a static NodeList rather than a live collection. Then we look at how event listeners attach, bubble, and get removed, and where a stale listener can quietly leak.',
  'The second half is about reading and writing the document without fighting the browser: batching layout reads, avoiding layout thrash inside loops, and using data attributes instead of parsing class names.',
  'We close with a short exercise: take the static markup in the shared repository, wire up delegation on a single parent element, and confirm in the console that only one listener is registered.',
].join('\n\n')
