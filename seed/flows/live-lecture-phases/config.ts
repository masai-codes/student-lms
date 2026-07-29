import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const LIVE_LECTURE_PHASES_FLOW_ID = 'live-lecture-phases' as const
export type LiveLecturePhasesFlowId = typeof LIVE_LECTURE_PHASES_FLOW_ID

/** HLS master playlist for post-lecture recording player (360/480/720/1080 variants). */
export const LIVE_LECTURE_RECORDING_HLS_URL =
  'https://cdn.masaischool.com/sal-videos/676eed49631470e143e061b0/676eea1ff936951f1cb8dc3d/master.m3u8'

/** Relative offsets used when seeding — all times are IST wall-clock strings. */
export const LIVE_LECTURE_PHASES_TIMING = {
  /** Lecture 1: >10 min before start → locked / “hasn't started yet”. */
  beforeUnlockScheduleMinutesFromNow: 20,
  /** Lecture 2: inside join window (5 min before start → conclude + 30 min). */
  duringJoinScheduleMinutesFromNow: 3,
  /** Lecture 3: ended well past the post-conclude grace window. */
  afterScheduleMinutesAgo: 120,
  afterConcludeMinutesAgo: 90,
  lectureDurationMinutes: 60,
} as const

export const liveLecturePhasesConfig: SeedFlowMeta = {
  id: LIVE_LECTURE_PHASES_FLOW_ID,
  description:
    'Live + video lecture phases: mandatory/optional live (before + join), type=video (mandatory + optional), after recording + attendance, transcript lectures (timestamped segments + plain-text fallback). Profile photo + download app pre-completed.',
  timing: { ...LIVE_LECTURE_PHASES_TIMING },
  seedCommand: 'npm run seed live-lecture-phases',
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(LIVE_LECTURE_PHASES_FLOW_ID, 'admin') },
    { role: 'student', email: flowScopedEmail(LIVE_LECTURE_PHASES_FLOW_ID, 'student') },
  ],
  primaryLoginRole: 'student',
}
