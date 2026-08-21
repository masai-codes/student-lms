import type {
  AiSummaryStatus,
  LectureRecordingStatus,
  LectureSupportSnapshot,
} from '@/server/api/support/support.types'
import { getAttendanceStatusLabels } from '@/lib/lecture-attendance/attendanceStatusLabels'
import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import { getListingAttendanceRender } from '@/lib/lecture-attendance/getListingAttendanceRender'
import type { ListingAttendanceVisibleState } from '@/lib/lecture-attendance/types'

export function formatRecordingStatusLabel(
  status: LectureRecordingStatus,
): string {
  return status === 'available' ? 'Available' : 'Not available'
}

export function formatAiSummaryStatusLabel(status: AiSummaryStatus): string {
  switch (status) {
    case 'generated':
      return 'Generated'
    case 'processing':
      return 'Processing'
    case 'not_available':
      return 'Not available'
  }
}

/**
 * Build a human-readable phrase about how much of the recording the student has
 * watched, used to contextualise the absent reason without revealing the
 * threshold. Only emitted when there is meaningful watch progress (> 0%).
 */
function watchProgressPhrase(watchPct: number): string {
  if (watchPct <= 0) return ''
  return ` You've watched ${Math.round(watchPct)}% of the recording so far.`
}

/**
 * Whether the student has watched enough of the recording to qualify for
 * attendance. Returns `true` when the threshold is unknown (we can't say they
 * haven't met it) so the UI falls back to generic messaging.
 */
function hasMetWatchThreshold(
  watchPct: number,
  threshold: number | null,
): boolean {
  if (threshold == null) return true
  return watchPct >= threshold
}

/**
 * Simple, student-facing explanation of a non-Present lecture attendance — so
 * they know what happened before raising a ticket. Branches on lecture kind
 * (a `video` lecture only has recording-watch attendance; a `live` lecture is
 * scored on joining live, with the recording as a possible catch-up depending
 * on the section's settings) and on whether the student is still inside the
 * catch-up window, has missed it entirely, or is mid-way through watching.
 *
 * Uses the student's actual watch % to give specific feedback:
 * - Below threshold → show watched % and say the full recording must be watched
 * - Met/exceeded threshold, within window → "just a matter of time (24 hrs)"
 * - Met/exceeded threshold, window closed → recording watched but window passed
 */
function buildAttendanceReason(
  snapshot: LectureSupportSnapshot,
  uiState: Extract<
    ListingAttendanceVisibleState,
    'absent' | 'att_window_over' | 'continue_watching'
  >,
): string {
  const attendance = snapshot.attendance
  if (!attendance) return 'Did not meet attendance criteria.'

  const isWindowOver = uiState === 'att_window_over'
  const isWatching = uiState === 'continue_watching'
  const watchPct = attendance.watchPercentage ?? 0
  const threshold = attendance.videoWatchThreshold
  const metThreshold = hasMetWatchThreshold(watchPct, threshold)

  if (snapshot.lectureKind === 'video') {
    if (isWindowOver) {
      if (metThreshold) {
        // Watched enough but the window has since closed — nothing to do now
        return 'You watched the full recording but the attendance window has since closed, so your status could not be updated.'
      }
      const progress = watchProgressPhrase(watchPct)
      return `You did not finish watching the recording and the window to do so has closed, so you were marked absent.${progress}`
    }
    if (isWatching) {
      if (metThreshold) {
        // Threshold met, still in window — just waiting for the 24-hr cron
        return 'You have watched the full recording. Your attendance status will update within 24 hours.'
      }
      const progress = watchProgressPhrase(watchPct)
      return `You need to watch the entire recording to be marked present.${progress} Your status will update within 24 hours once you finish.`
    }
    // absent, not currently watching
    const progress = watchProgressPhrase(watchPct)
    return `You have not watched this recording yet, so you were marked absent. Watch the full recording to be marked present.${progress}`
  }

  // Live lecture
  const lateByMinutes = attendance.lateByMinutes
  const joinedLate = lateByMinutes != null && lateByMinutes > 0

  const liveReason = joinedLate
    ? attendance.markAbsentIfLate
      ? `You joined the live session late by ${lateByMinutes} min, past the allowed limit, so you were marked absent.`
      : `You joined the live session late by ${lateByMinutes} min — that alone doesn't mark you absent; your status will update within 24 hours.`
    : 'You did not join the live session, so you were marked absent.'

  if (!attendance.videoCountsForAttendance) {
    return `${liveReason} Only live class attendance is counted for this session; watching the recording will not change your status.`
  }

  if (isWindowOver) {
    if (metThreshold) {
      return `${liveReason} You watched the full recording but the catch-up window has since closed.`
    }
    const progress = watchProgressPhrase(watchPct)
    return `${liveReason} The window to watch the recording and claim attendance has closed.${progress}`
  }
  if (isWatching) {
    if (metThreshold) {
      return `${liveReason} You have watched the full recording — your attendance status will update within 24 hours.`
    }
    const progress = watchProgressPhrase(watchPct)
    return `${liveReason} Watch the entire recording to become Present; status updates can take up to 24 hours.${progress}`
  }
  const progress = watchProgressPhrase(watchPct)
  return `${liveReason} You can still watch the full recording to become Present within the catch-up window.${progress}`
}

export function getSupportAttendancePresentation(
  snapshot: LectureSupportSnapshot,
): {
  label: string
  colorClass: string
  showAbsentReason: boolean
  absentReason: string | null
  /**
   * Whether this is a hard "absent" (vs pending / N/A). Callers style off this
   * instead of comparing `label`, which is portal-dependent wording.
   */
  isAbsent: boolean
} {
  if (!snapshot.showAttendance) {
    return {
      label: 'N/A',
      colorClass: 'text-[#62647d] dark:text-foreground-muted',
      showAbsentReason: false,
      absentReason: null,
      isAbsent: false,
    }
  }

  const labels = getAttendanceStatusLabels()
  const render = getListingAttendanceRender(snapshot.attendance)
  if (render.uiState === 'present') {
    return {
      label: labels.present,
      colorClass: 'text-[#0E9F6E] dark:text-success',
      showAbsentReason: false,
      absentReason: null,
      isAbsent: false,
    }
  }

  if (
    render.uiState === 'absent' ||
    render.uiState === 'att_window_over' ||
    render.uiState === 'continue_watching'
  ) {
    const isPending = render.uiState === 'continue_watching'
    return {
      label: isPending ? 'Pending' : labels.absent,
      colorClass: isPending
        ? 'text-[#62647d] dark:text-foreground-muted'
        : 'text-[#ef4444] dark:text-danger',
      showAbsentReason: true,
      absentReason: buildAttendanceReason(snapshot, render.uiState),
      isAbsent: !isPending,
    }
  }

  return {
    label: 'Pending',
    colorClass: 'text-[#62647d] dark:text-foreground-muted',
    showAbsentReason: false,
    absentReason: null,
    isAbsent: false,
  }
}

/**
 * Catch-up countdown for the support snapshot — mirrors the lecture detail header
 * (`getListingAttendanceRender` + `formatCatchUpRemainingLabel`).
 */
export function getSupportCatchUpPresentation(
  snapshot: LectureSupportSnapshot,
): {
  label: string
} {
  if (!snapshot.showAttendance || snapshot.attendance == null) {
    return { label: 'N/A' }
  }

  const render = getListingAttendanceRender(snapshot.attendance)

  if (render.uiState === 'att_window_over') {
    return { label: 'Closed' }
  }

  if (render.uiState === 'present') {
    return { label: 'N/A' }
  }

  if (!snapshot.attendance.videoCountsForAttendance) {
    return { label: 'N/A' }
  }

  const remainingText = formatCatchUpRemainingLabel(render.daysRemaining)

  if (remainingText) {
    return { label: remainingText }
  }

  return { label: '—' }
}

export function shouldShowUnableToJoinLiveLecture(
  snapshot: LectureSupportSnapshot,
): boolean {
  return snapshot.lectureKind === 'live' && snapshot.livePhase === 'during'
}
