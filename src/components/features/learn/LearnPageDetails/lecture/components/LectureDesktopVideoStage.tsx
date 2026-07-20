'use client'

import type { ReactNode } from 'react'

import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'

import { LectureFloatingChat } from '@/components/features/lecture-ai-chat/components/LectureFloatingChat'

type LectureDesktopVideoStageProps = {
  lectureId: number
  video: ReactNode
}

/**
 * Desktop lecture stage: the video always renders full width, with the AI chat
 * living in a floating "Ask" popup instead of a sidebar that shrinks the video.
 * The shared open state is provided so the in-video (fullscreen) launcher and
 * this page-level launcher stay in sync.
 */
export function LectureDesktopVideoStage({
  lectureId,
  video,
}: LectureDesktopVideoStageProps) {
  const splitChat = useLectureSplitChatOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()

  return (
    <LectureSplitChatProvider value={splitChat}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-black">
        {video}
      </div>

      {/* Page-level floating chat. Hidden while the video is in browser
          fullscreen — the in-video launcher (LectureReactPlayer) takes over,
          since a body-portaled node can't render over the fullscreen element. */}
      {!isVideoFullscreen ? (
        <LectureFloatingChat lectureId={lectureId} state={splitChat} />
      ) : null}
    </LectureSplitChatProvider>
  )
}
