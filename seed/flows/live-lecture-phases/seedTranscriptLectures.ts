import { createLecture, createLecturesAi } from '../../factories'
import {
  SAMPLE_TRANSCRIPT_PLAIN_TEXT,
  SAMPLE_TRANSCRIPT_SEGMENTS,
  SAMPLE_TRANSCRIPT_TEXT,
} from './sampleTranscript'

import type { CreateLectureOverrides } from '../../factories/createLecture'
import type { lectures, lecturesAi } from '@/db/schema'

type LectureRow = typeof lectures.$inferSelect
type LecturesAiRow = typeof lecturesAi.$inferSelect

export type TranscriptLectureSeeds = {
  /** Timestamped segments — the Transcript tab's list + `[m:ss]` download. */
  segmented: LectureRow
  segmentedAi: LecturesAiRow
  /** Plain text only — the tab's markdown fallback + untimestamped download. */
  plainText: LectureRow
  plainTextAi: LecturesAiRow
}

const SEGMENTED_NOTES = [
  '## Session notes',
  '',
  'Seeded for **transcript** QA: Transcript tab, CC overlay on the recording, and',
  'the Download button (saves `lecture-<id>-transcript.txt`).',
  '',
  '- Long enough to overflow the collapsed tab height ("Show more")',
  '- Timestamps cover both `m:ss` and `h:mm:ss` (the closing block crosses 1:00:00)',
].join('\n')

const PLAIN_TEXT_NOTES = [
  '## Session notes',
  '',
  'Seeded for **transcript fallback** QA: `lectures_ai.transcript` is set but',
  '`transcript_segments` is empty, the shape older lectures have.',
  '',
  '- Transcript tab renders the flat text, not the timestamped list',
  '- The download is the same plain text, with no `[m:ss]` prefixes',
].join('\n')

/**
 * Two recording lectures dedicated to transcript QA — one with timestamped
 * segments, one with only the plain-text fallback. `lectureDefaults` carries the
 * caller's shared video/recording fields and scheduling, so these land in the
 * same past-lecture phase as the other recordings in the flow.
 */
export async function seedTranscriptLectures(
  flowId: string,
  lectureDefaults: CreateLectureOverrides,
): Promise<TranscriptLectureSeeds> {
  const segmented = await createLecture({
    ...lectureDefaults,
    title: `[${flowId}] Transcript — timestamped segments (download + CC)`,
    description: [
      `Seed flow: ${flowId}`,
      'Phase: after — recording playable, transcript seeded with timestamped segments.',
      'Covers the Transcript tab list, the CC caption overlay, and the transcript Download button.',
    ].join('\n'),
    notes: SEGMENTED_NOTES,
    optional: 0,
  })

  const segmentedAi = await createLecturesAi({
    lectureId: segmented.id,
    transcript: SAMPLE_TRANSCRIPT_TEXT,
    transcriptSegments: SAMPLE_TRANSCRIPT_SEGMENTS,
    isSummaryPublished: 0,
  })

  const plainText = await createLecture({
    ...lectureDefaults,
    title: `[${flowId}] Transcript — plain text only (no segments)`,
    description: [
      `Seed flow: ${flowId}`,
      'Phase: after — recording playable, transcript seeded without segments.',
      'Covers the plain-text transcript fallback and its untimestamped download.',
    ].join('\n'),
    notes: PLAIN_TEXT_NOTES,
    optional: 1,
  })

  const plainTextAi = await createLecturesAi({
    lectureId: plainText.id,
    transcript: SAMPLE_TRANSCRIPT_PLAIN_TEXT,
    transcriptSegments: null,
    isSummaryPublished: 0,
  })

  return { segmented, segmentedAi, plainText, plainTextAi }
}
