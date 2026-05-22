import type { MutableRefObject } from 'react'
import type ReactPlayer from 'react-player'

export type LectureChromePlayerRef = ReactPlayer | null

export type VimeoLikeInternal = {
  play?: () => void | Promise<void>
  pause?: () => void | Promise<void>
  getPaused?: () => boolean | Promise<boolean>
  setVolume?: (value: number) => void | Promise<void>
  getVolume?: () => number | Promise<number>
  setMuted?: (muted: boolean) => void | Promise<void>
  getMuted?: () => boolean | Promise<boolean>
  on?: (event: string, callback?: () => void) => void
  off?: (event: string, callback?: () => void) => void
}

export function asPromise<T>(value: T | Promise<T>): Promise<T> {
  return Promise.resolve(value)
}

export function getHtmlVideoFromPlayer(
  videoRef: MutableRefObject<LectureChromePlayerRef>,
): HTMLVideoElement | null {
  const player = videoRef.current
  if (!player) return null
  const internal = player.getInternalPlayer() as HTMLVideoElement | unknown
  if (
    internal &&
    typeof internal === 'object' &&
    'tagName' in internal &&
    (internal as HTMLVideoElement).tagName === 'VIDEO'
  ) {
    return internal as HTMLVideoElement
  }
  return null
}

export function getVimeoLikeInternal(
  videoRef: MutableRefObject<LectureChromePlayerRef>,
): VimeoLikeInternal | null {
  const player = videoRef.current
  if (!player) return null
  const internal = player.getInternalPlayer() as VimeoLikeInternal | unknown
  if (!internal || typeof internal !== 'object') return null
  const candidate = internal as VimeoLikeInternal
  if (typeof candidate.getPaused === 'function') return candidate
  return null
}

export function playbackRateLabel(rate: number): string {
  if (!Number.isFinite(rate)) return '1x'
  if (rate === 1) return '1x'
  if (Number.isInteger(rate)) return `${rate}x`
  return `${rate}x`
}

export function formatVideoClock(seconds: number, useLongFormat: boolean): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return useLongFormat ? '0:00:00' : '0:00'
  }
  const total = Math.floor(seconds)
  if (!useLongFormat) {
    const minutes = Math.floor(total / 60)
    const remainder = total % 60
    return `${minutes}:${remainder.toString().padStart(2, '0')}`
  }
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
}

export function clampTime(seconds: number, totalDuration: number): number {
  if (!(totalDuration > 0)) return 0
  return Math.min(totalDuration, Math.max(0, seconds))
}

export function scrubRatioFromClientX(
  trackElement: HTMLElement | null,
  clientX: number,
): number | null {
  if (!trackElement) return null
  const rect = trackElement.getBoundingClientRect()
  if (!(rect.width > 0)) return null
  const ratio = (clientX - rect.left) / rect.width
  if (!Number.isFinite(ratio)) return null
  return Math.min(1, Math.max(0, ratio))
}

export function isTouchLikePointer(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}
