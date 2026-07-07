import type {
  AiSummaryStatus,
  LectureRecordingStatus,
  LectureSupportSnapshot,
} from '@/server/api/support/support.types'
import { getListingAttendanceRender } from '@/lib/lecture-attendance/getListingAttendanceRender'

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

export function getSupportAttendancePresentation(snapshot: LectureSupportSnapshot): {
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

  if (render.uiState === 'absent' || render.uiState === 'att_window_over') {
    const lateByMinutes = snapshot.attendance?.lateByMinutes
    const absentReason =
      lateByMinutes != null && lateByMinutes > 0
        ? `Joined late by ${lateByMinutes} min and did not meet duration criteria`
        : 'Did not meet attendance criteria'

    return {
      label: 'Absent',
      colorClass: 'text-[#ef4444]',
      showAbsentReason: true,
      absentReason,
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
