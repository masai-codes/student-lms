const MIN_CUTOFF_SECONDS = 30
const MAX_CUTOFF_SECONDS = 300

export function progressUpdateCutoffSeconds(totalDuration: number): number {
  const baseCutoffSeconds = totalDuration / 20
  return Math.min(
    MAX_CUTOFF_SECONDS,
    Math.max(MIN_CUTOFF_SECONDS, baseCutoffSeconds),
  )
}

export function shouldSaveVideoProgress(params: {
  timer: number
  totalDuration: number
  failCount: number
  nextApiRetryAt: number | null
  isUpdating: boolean
  force?: boolean
}): boolean {
  const { timer, totalDuration, failCount, nextApiRetryAt, isUpdating, force } =
    params

  if (isUpdating) return false
  if (Number.isNaN(totalDuration) || Number.isNaN(timer) || timer < 1) {
    return false
  }
  if (totalDuration < 1) return false

  if (force) return true

  const cutoffDuration = progressUpdateCutoffSeconds(totalDuration)
  const shouldMakeApiCall =
    !failCount || (nextApiRetryAt !== null && timer > nextApiRetryAt)

  return timer >= cutoffDuration && shouldMakeApiCall
}

export function nextVideoProgressRetryAt(
  failCount: number,
  timer: number,
): number {
  return Math.min(failCount * 6, 30) + timer
}
