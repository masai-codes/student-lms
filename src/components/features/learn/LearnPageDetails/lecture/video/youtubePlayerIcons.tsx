import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type YoutubeIconProps = {
  className?: string
}

const iconClass = 'size-6 shrink-0'

function YoutubeIcon({
  className,
  children,
}: YoutubeIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(iconClass, className)}
      fill="currentColor"
    >
      {children}
    </svg>
  )
}

/** YouTube play (filled triangle). */
export function YoutubePlayIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M8 5v14l11-7L8 5z" />
    </YoutubeIcon>
  )
}

/** YouTube pause (two bars). */
export function YoutubePauseIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </YoutubeIcon>
  )
}

/** YouTube volume on. */
export function YoutubeVolumeHighIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </YoutubeIcon>
  )
}

/** YouTube muted. */
export function YoutubeVolumeMutedIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-4.5 4.03v2.06c4.01-.91 7-4.49 7-8.77 0-.94-.2-1.82-.54-2.64l-1.51 1.51c.34.82.54 1.7.54 2.64 0 2.17-2.11 4.85-5 6.71zM3.27 3 2 4.27 7.73 10H3v4h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L3.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    </YoutubeIcon>
  )
}

/** YouTube fullscreen. */
export function YoutubeFullscreenIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </YoutubeIcon>
  )
}

/**
 * Enter theater mode — wide horizontal frame (YouTube `ytp-theater-button`).
 */
export function YoutubeTheaterModeIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
    </YoutubeIcon>
  )
}

/**
 * Exit theater / default view — wide frame with inner bar (YouTube when theater is on).
 */
export function YoutubeDefaultViewIcon(props: YoutubeIconProps) {
  return (
    <YoutubeIcon {...props}>
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
      <path d="M8 13h8v4H8v-4z" />
    </YoutubeIcon>
  )
}
