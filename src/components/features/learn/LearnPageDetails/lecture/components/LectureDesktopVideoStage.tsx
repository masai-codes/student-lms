'use client'

import { useRef, type ReactNode } from 'react'

import { LectureChatSidePanel } from './LectureChatSidePanel'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useChatPanelReveal } from '../hooks/useChatPanelReveal'
import { useLectureChatWidth } from '../hooks/useLectureChatWidth'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'

type LectureDesktopVideoStageProps = {
  lectureId: number
  video: ReactNode
}

/**
 * Desktop lecture stage: the video and the AI chat sit side by side with a
 * draggable divider, so the learner chooses how much width to give each. The
 * chat is opened from the in-player "Ask AI" control (shared open state); when
 * closed, the video fills the row. Hidden while the video is in browser
 * fullscreen — the in-video chat instance (LectureReactPlayer) takes over there.
 */
export function LectureDesktopVideoStage({
  lectureId,
  video,
}: LectureDesktopVideoStageProps) {
  const splitChat = useLectureSplitChatOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, isDragging, startResize, nudge } =
    useLectureChatWidth(containerRef)
  const { isRendered, isOpenAnim } = useChatPanelReveal(
    splitChat.isOpen && !isVideoFullscreen,
  )

  return (
    <LectureSplitChatProvider value={splitChat}>
      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 flex-row">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          {video}
        </div>

        {isRendered ? (
          <LectureChatSidePanel
            lectureId={lectureId}
            onClose={splitChat.close}
            width={width}
            isDragging={isDragging}
            isOpen={isOpenAnim}
            onResizeStart={startResize}
            onNudge={nudge}
          />
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
