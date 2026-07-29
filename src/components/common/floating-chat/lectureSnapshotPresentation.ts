import type {
  AiSummaryStatus,
  LectureRecordingStatus,
  LectureSupportSnapshot,
} from '@/server/api/support/support.types'
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
 * Simple, student-facing explanation of a non-Present lecture attendance — so
 * they know what happened before raising a ticket. Branches on lecture kind
 * (a `video` lecture only has recording-watch attendance; a `live` lecture is
 * scored on joining live, with the recording as a possible catch-up depending
 * on the section's settings) and on whether the student is still inside the
 * catch-up window, has missed it entirely, or is mid-way through watching.
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

  if (snapshot.lectureKind === 'video') {
    if (isWindowOver) {
      return 'You did not finish watching the recording and the window to finish it has closed, so you were marked absent.'
    }
    if (isWatching) {
      return 'Finish watching the recording to be marked present — status updates can take up to 24 hours.'
    }
    return 'You have not watched this recording yet, so you were marked absent. Watch the full recording to be marked present.'
  }

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
    return `${liveReason} The window to watch the recording and claim attendance has closed.`
  }
  if (isWatching) {
    return `${liveReason} Finish watching the recording to become Present; status updates can take up to 24 hours.`
  }
  return `${liveReason} You can still watch the recording to become Present within the catch-up window.`
}

export function getSupportAttendancePresentation(
  snapshot: LectureSupportSnapshot,
): {
  label: string
  colorClass: string
  showAbsentReason: boolean
  absentReason: string | null
} {
  if (!snapshot.showAttendance) {
    return {
      label: 'N/A',
      colorClass: 'text-[#62647d]',
      showAbsentReason: false,
      absentReason: null,
    }
  }

  const render = getListingAttendanceRender(snapshot.attendance)
  if (render.uiState === 'present') {
    return {
      label: 'Present',
      colorClass: 'text-[#0E9F6E]',
      showAbsentReason: false,
      absentReason: null,
    }
  }

  if (
    render.uiState === 'absent' ||
    render.uiState === 'att_window_over' ||
    render.uiState === 'continue_watching'
  ) {
    const isPending = render.uiState === 'continue_watching'
    return {
      label: isPending ? 'Pending' : 'Absent',
      colorClass: isPending ? 'text-[#62647d]' : 'text-[#ef4444]',
      showAbsentReason: true,
      absentReason: buildAttendanceReason(snapshot, render.uiState),
    }
  }

  return {
    label: 'Pending',
    colorClass: 'text-[#62647d]',
    showAbsentReason: false,
    absentReason: null,
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
  const remainingText = formatCatchUpRemainingLabel(
    render.remainingLabel,
    render.daysRemaining,
  )

  if (remainingText) {
    return { label: remainingText }
  }

  if (render.uiState === 'att_window_over') {
    return { label: 'Closed' }
  }

  if (render.uiState === 'present') {
    return { label: 'N/A' }
  }

  if (!snapshot.attendance.videoCountsForAttendance) {
    return { label: 'N/A' }
  }

  return { label: '—' }
}

export function shouldShowUnableToJoinLiveLecture(
  snapshot: LectureSupportSnapshot,
): boolean {
  return snapshot.lectureKind === 'live' && snapshot.livePhase === 'during'
}
