'use client'

import type { ReactNode } from 'react'

import { ChatbotExperience } from '@/components/features/chatbot/ChatbotExperience'

import { getLectureSplitChatOpenWidthCss } from '../constants/lectureSplitLayout'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'

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
          className="flex h-full min-h-0 shrink-0 flex-col border-l border-gray-200 bg-white"
          style={{ width: getLectureSplitChatOpenWidthCss() }}
        >
          <ChatbotExperience lectureId={lectureId} onCloseSidebar={splitChat.close} />
        </div>
      ) : null}
    </>
  )
}
