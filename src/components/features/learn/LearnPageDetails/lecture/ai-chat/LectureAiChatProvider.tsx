'use client'

import { RoomAudioRenderer, RoomContext } from '@livekit/components-react'
import { ClientOnly } from '@tanstack/react-router'
import { Room } from 'livekit-client'
import { useEffect, useState } from 'react'

import { useLectureAiChat } from './hooks/useLectureAiChat'
import { LectureAiChatStateProvider } from './LectureAiChatStateContext'
import type { ReactNode } from 'react'

type LectureAiChatProviderProps = {
  lectureId: number
  language?: string
  defaultExpanded?: boolean
  children: ReactNode
}

type LectureAiChatStateGateProps = {
  lectureId: number
  language?: string
  defaultExpanded?: boolean
  children: ReactNode
}

/**
 * Mounts the chat state hook *inside* the LiveKit `RoomContext.Provider` so
 * the underlying LiveKit hooks (`useChat`, `useTranscriptions`,
 * `useTrackToggle`) can resolve the room.
 */
function LectureAiChatStateGate({
  lectureId,
  language,
  defaultExpanded,
  children,
}: LectureAiChatStateGateProps) {
  const chat = useLectureAiChat({ lectureId, language, defaultExpanded })
  return (
    <LectureAiChatStateProvider value={chat}>
      {children}
      <RoomAudioRenderer />
    </LectureAiChatStateProvider>
  )
}

/**
 * Top-level wrapper for the lecture's AI tutor chat. Owns:
 * - the LiveKit `Room` (single instance per lecture),
 * - the `<RoomAudioRenderer />` so the AI's voice is always audible,
 * - the shared chat state (`useLectureAiChat`) consumed by sidebar + dock.
 *
 * Everything that depends on LiveKit only mounts on the client. On the server
 * we pass `children` straight through so the rest of the lecture page can
 * still SSR; chat consumers fall back to a no-op state until hydration.
 */
function LectureAiChatProviderInner({
  lectureId,
  language,
  defaultExpanded,
  children,
}: LectureAiChatProviderProps) {
  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      }),
  )

  useEffect(() => {
    return () => {
      void room.disconnect()
    }
  }, [room])

  return (
    <RoomContext.Provider value={room}>
      <LectureAiChatStateGate
        lectureId={lectureId}
        language={language}
        defaultExpanded={defaultExpanded}
      >
        {children}
      </LectureAiChatStateGate>
    </RoomContext.Provider>
  )
}

export function LectureAiChatProvider(props: LectureAiChatProviderProps) {
  return (
    <ClientOnly fallback={<>{props.children}</>}>
      <LectureAiChatProviderInner {...props} />
    </ClientOnly>
  )
}
