'use client'

import { useTranscriptions } from '@livekit/components-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeChatMessages } from '../utils/mergeChatMessages'
import type { TextStreamData } from '@livekit/components-react'

import type { AiChatMessage } from '@/server/ai-chat/types'

import type { LectureChatMessage } from '../types'
import {
  fetchAiChatHistoryRequest,
  sendAiChatMessageRequest,
} from '@/lib/api/learn/aiChatApi'


function aiChatMessageToLecture(msg: AiChatMessage): LectureChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    source: 'history',
  }
}

function liveTranscriptsToMessages(
  transcriptions: ReadonlyArray<TextStreamData>,
): Array<LectureChatMessage> {
  return transcriptions
    .filter(t => Boolean(t.text))
    .map(t => {
      const identity = t.participantInfo.identity
      const isAgent = /agent|tutor|ai/i.test(identity)
      return {
        id: `voice-${identity}-${t.streamInfo.id}`,
        role: isAgent ? ('assistant' as const) : ('user' as const),
        content: t.text,
        timestamp: t.streamInfo.timestamp,
        source: 'live-voice' as const,
      }
    })
}

type UseAiTutorMessagesOptions = {
  lectureId: number
  /** Optional cache-busting key; if it changes, history is re-fetched. */
  refetchKey?: string | number
}

type UseAiTutorMessagesResult = {
  messages: Array<LectureChatMessage>
  isHistoryLoading: boolean
  historyError: string | null
  send: (text: string) => Promise<void>
  isSending: boolean
  refetchHistory: () => void
}

export function useAiTutorMessages({
  lectureId,
  refetchKey,
}: UseAiTutorMessagesOptions): UseAiTutorMessagesResult {
  const transcriptions = useTranscriptions()

  const [history, setHistory] = useState<Array<LectureChatMessage>>([])
  const [pending, setPending] = useState<Array<LectureChatMessage>>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsHistoryLoading(true)
    setHistoryError(null)
    fetchAiChatHistoryRequest(lectureId)
      .then(rows => {
        if (cancelled) return
        setHistory(rows.map(aiChatMessageToLecture))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setHistoryError(
          error instanceof Error ? error.message : 'AI_CHAT_UNKNOWN_ERROR',
        )
      })
      .finally(() => {
        if (!cancelled) setIsHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lectureId, refetchKey, historyVersion])

  const liveVoice = useMemo(
    () => liveTranscriptsToMessages(transcriptions),
    [transcriptions],
  )

  const messages = useMemo(
    () => mergeChatMessages(history, pending, liveVoice),
    [history, pending, liveVoice],
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const localId = `local-${Date.now()}`
      const now = Date.now()
      const optimistic: LectureChatMessage = {
        id: localId,
        role: 'user',
        content: trimmed,
        timestamp: now,
        source: 'live-text',
      }
      setPending(prev => [...prev, optimistic])
      setIsSending(true)

      try {
        const result = await sendAiChatMessageRequest({
          lectureId,
          message: trimmed,
        })
        setHistory(prev =>
          mergeChatMessages(prev, [
            aiChatMessageToLecture(result.userMessage),
            aiChatMessageToLecture(result.assistantMessage),
          ]),
        )
        setPending(prev => prev.filter(m => m.id !== localId))
      } catch (error) {
        setPending(prev => prev.filter(m => m.id !== localId))
        throw error
      } finally {
        setIsSending(false)
      }
    },
    [lectureId],
  )

  return {
    messages,
    isHistoryLoading,
    historyError,
    send,
    isSending,
    refetchHistory: () => setHistoryVersion(v => v + 1),
  }
}
