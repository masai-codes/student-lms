import type {
  AiSummaryStatus,
  LectureRecordingStatus,
  LectureSupportSnapshot,
} from '@/server/api/support/support.types'
import { getListingAttendanceRender } from '@/lib/lecture-attendance/getListingAttendanceRender'
import type { ListingAttendanceVisibleState } from '@/lib/lecture-attendance/types'

export function formatSupportDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return `${total}s`
}

export function formatRecordingStatusLabel(status: LectureRecordingStatus): string {
  switch (status) {
    case 'available':
      return 'Available'
    case 'processing':
      return 'Processing'
    case 'not_available':
      return 'Not available'
    case 'pending':
      return 'Pending'
  }
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

function optionalAttendanceReason(lectureKind: LectureSupportSnapshot['lectureKind']): string {
  if (lectureKind === 'video') {
    return "This lecture is optional, so watching it does not count toward your attendance status. But trust us, it's worth the watch."
  }
  return "This lecture is optional, so its attendance is not counted toward your attendance status. Only mandatory live class attendance is considered. But trust us, it's worth the watch."
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
  uiState: Extract<ListingAttendanceVisibleState, 'absent' | 'att_window_over' | 'continue_watching'>,
): string {
  const attendance = snapshot.attendance
  if (!attendance) return 'Did not meet attendance criteria.'

  const isWindowOver = uiState === 'att_window_over'
  const isWatching = uiState === 'continue_watching'
  const watched = Math.round(attendance.watchPercentage || attendance.videoPercentage || 0)

  if (snapshot.lectureKind === 'video') {
    if (isWindowOver) {
      return watched > 0
        ? `You only watched ${watched}% of the recording and the window to finish it has closed, so you were marked absent.`
        : 'You did not watch this recording and the window to watch it has closed, so you were marked absent.'
    }
    if (isWatching) {
      return `You've watched ${watched}% of the recording. Watch it fully to be marked present — status updates can take up to 24 hours.`
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
    return `${liveReason} You're currently at ${watched}% of the recording — finish watching to become Present; status updates can take up to 24 hours.`
  }
  return `${liveReason} You can still watch the recording to become Present within the catch-up window.`
}

export function getSupportAttendancePresentation(snapshot: LectureSupportSnapshot): {
  label: string
  colorClass: string
  showAbsentReason: boolean
  absentReason: string | null
} {
  if (!snapshot.isMandatory) {
    return {
      label: 'N/A',
      colorClass: 'text-[#62647d]',
      showAbsentReason: true,
      absentReason: optionalAttendanceReason(snapshot.lectureKind),
    }
  }

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

export function shouldShowLectureDuration(snapshot: LectureSupportSnapshot): boolean {
  return snapshot.recordingStatus === 'available' && snapshot.durationSeconds != null
}

export function shouldShowUnableToJoinLiveLecture(snapshot: LectureSupportSnapshot): boolean {
  return snapshot.lectureKind === 'live' && snapshot.livePhase === 'during'
}
