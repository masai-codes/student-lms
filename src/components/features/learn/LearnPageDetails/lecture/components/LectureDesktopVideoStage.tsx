'use client'

import { useRef, type ReactNode } from 'react'

import { LectureChatResizeHandle } from './LectureChatResizeHandle'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useLectureChatWidth } from '../hooks/useLectureChatWidth'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'

import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'

type LectureDesktopVideoStageProps = {
  lectureId: number
  video: ReactNode
}

/**
 * Desktop lecture stage: the video and the AI chat sit side by side with a
 * draggable divider, so the learner chooses how much width to give each. The
 * chat is opened from the in-player "Ask AI" control (shared open state); when
 * closed, the video fills the row. Hidden while the video is in browser
 * fullscreen — the in-video chat instance takes over there.
 */
export function LectureDesktopVideoStage({
  lectureId,
  video,
}: LectureDesktopVideoStageProps) {
  const splitChat = useLectureSplitChatOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, isDragging, startResize, nudge } = useLectureChatWidth(containerRef)

  const showChat = splitChat.isOpen && !isVideoFullscreen

  return (
    <LectureSplitChatProvider value={splitChat}>
      <div
        ref={containerRef}
        className="flex min-h-0 min-w-0 flex-1 flex-row"
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          {video}
        </div>

        {showChat ? (
          <>
            <LectureChatResizeHandle
              onPointerDown={startResize}
              onNudge={nudge}
              isDragging={isDragging}
            />
            <div
              data-testid="lecture-chat-panel"
              className="flex h-full min-h-0 shrink-0 flex-col border-l border-border bg-background"
              style={{ width }}
            >
              <LectureAiChatExperience
                lectureId={lectureId}
                onCloseSidebar={splitChat.close}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* While dragging, a transparent overlay keeps the pointer stream off the
          video iframe (which would otherwise swallow pointermove events). */}
      {isDragging ? (
        <div className="fixed inset-0 z-[130] cursor-col-resize" />
      ) : null}
    </LectureSplitChatProvider>
  )
}
