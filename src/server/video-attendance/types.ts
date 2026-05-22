export type WatchIntervalSegment = { start: number; end: number }

export type VideoProgressData = {
  lectureId: number
  lastWatchedPosition: number
  totalDuration: number | null
  watchPercentage: number
}

export type VideoAttendanceIntervalsData = {
  lectureId: number
  lastWatchedPosition: number
  intervals: Array<WatchIntervalSegment>
}

export type StoreVideoProgressInput = {
  lectureId: number
  totalDuration: number
  intervals: Array<WatchIntervalSegment>
  sessionToken?: string
}
