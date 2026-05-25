'use client'

import {
  LECTURE_CHAT_OPENING_LOADER_GIF,
  LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  lectureChatOpeningLoaderSrc,
} from './constants/lectureAiChatUi'
import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'


import './lectureAiChatPanelLoader.css'

type LectureAiChatPanelLoaderProps = {
  /** How long the gif takes to travel left → right (ms). */
  sweepDurationMs?: number
  /** Gif height in pixels (width scales automatically). */
  sizePx?: number
  /** File in `/public` or full path (e.g. `pengu-pudgy.gif`). */
  gif?: string
  className?: string
}

export function LectureAiChatPanelLoader({
  sweepDurationMs = LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  sizePx = LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  gif = LECTURE_CHAT_OPENING_LOADER_GIF,
  className,
}: LectureAiChatPanelLoaderProps) {
  return (
    <div
      className={cn('lecture-chat-panel-loader', className)}
      aria-hidden
    >
      <img
        src={lectureChatOpeningLoaderSrc(gif)}
        alt=""
        className="lecture-chat-panel-loader__gif"
        style={
          {
            '--lecture-chat-loader-duration': `${sweepDurationMs}ms`,
            '--lecture-chat-loader-size': `${sizePx}px`,
          } as CSSProperties
        }
      />
    </div>
  )
}
