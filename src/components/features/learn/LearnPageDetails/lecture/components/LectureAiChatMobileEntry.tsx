'use client'

import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'
import { useLectureRailViewport } from '../hooks/useLectureRailViewport'

import { LectureAiChatMobileDock } from '@/components/features/lecture-ai-chat/components/LectureAiChatMobileDock'

type LectureAiChatMobileEntryProps = {
  lectureId: number
}

/**
 * Mobile + tablet AI chat surface: a below-hero composer launcher plus a bottom
 * drawer holding the full chat. Bound to the shared session and open-state
 * (LectureSplitChatContext), so it's the same conversation as the laptop rail
 * and the in-video fullscreen chat, and the player's "Ask AI" pill opens it too.
 */
export function LectureAiChatMobileEntry({
  lectureId,
}: LectureAiChatMobileEntryProps) {
  const splitChat = useLectureSplitChatOptional()
  const isRail = useLectureRailViewport()
  // On laptop/desktop the chat is the side rail — don't mount the drawer at all
  // (it's portaled to <body>, so it would otherwise open from the bottom over
  // the rail). Only one surface is ever mounted.
  if (!splitChat || isRail) return null

  return (
    <LectureAiChatMobileDock
      chat={splitChat.chat}
      feedback={splitChat.feedback}
      lectureId={lectureId}
      open={splitChat.isOpen}
      onOpenChange={(open) => (open ? splitChat.open() : splitChat.close())}
    />
  )
}
