'use client'

import { getLectureSplitChatOpenWidthCss } from '../constants/lectureSplitLayout'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'

import type { ReactNode } from 'react'

import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'

type LectureDesktopChatSidebarProps = {
  lectureId: number
  video: ReactNode
}

export function LectureDesktopChatSidebar({
  lectureId,
  video,
}: LectureDesktopChatSidebarProps) {
  const splitChat = useLectureSplitChatOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()

  return (
    <>
      <LectureSplitChatProvider value={splitChat}>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          {video}
        </div>
      </LectureSplitChatProvider>

      {splitChat.isOpen && !isVideoFullscreen ? (
        <div
          className="flex h-full min-h-0 shrink-0 flex-col border-l border-border bg-surface py-3"
          style={{ width: getLectureSplitChatOpenWidthCss() }}
        >
          <LectureAiChatExperience
            lectureId={lectureId}
            onCloseSidebar={splitChat.close}
          />
        </div>
      ) : null}
    </>
  )
}
