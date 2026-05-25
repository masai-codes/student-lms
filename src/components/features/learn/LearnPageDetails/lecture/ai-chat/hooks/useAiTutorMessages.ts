'use client'

import {
  
  
  useChat,
  useTranscriptions
} from '@livekit/components-react'
import { useEffect, useMemo, useState } from 'react'

import { mergeChatMessages } from '../utils/mergeChatMessages'
import type {ReceivedChatMessage, TextStreamData} from '@livekit/components-react';
import type { AiTutorTranscriptSession } from '@/server/ai-tutor/types'

import type { LectureChatMessage } from '../types'
import { fetchAiTutorTranscriptRequest } from '@/lib/api/learn/aiTutorApi'

function transcriptSessionsToMessages(
  sessions: Array<AiTutorTranscriptSession>,
): Array<LectureChatMessage> {
  const messages: Array<LectureChatMessage> = []
  for (const session of sessions) {
    session.transcript.forEach((entry, index) => {
      const ts = new Date(entry.timestamp).getTime()
      messages.push({
        id: `history-${session.sessionId}-${index}`,
        role: entry.role,
        content: entry.content,
        timestamp: Number.isFinite(ts) ? ts : Date.now(),
        source: 'history',
      })
    })
  }
  return messages
}

function liveTextChatToMessages(
  chatMessages: ReadonlyArray<ReceivedChatMessage>,
): Array<LectureChatMessage> {
  return chatMessages.map(msg => {
    const fromIsLocal = msg.from?.isLocal === true
    const fromIdentity = msg.from?.identity ?? ''
    const fromAgent =
      !fromIsLocal && /agent|tutor/i.test(fromIdentity)
    return {
      id: msg.id,
      role: fromAgent ? 'assistant' : 'user',
      content: msg.message,
      timestamp: msg.timestamp,
      source: 'live-text',
    }
  })
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
        role: isAgent ? 'assistant' : 'user',
        content: t.text,
        timestamp: t.streamInfo.timestamp,
        source: 'live-voice',
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
  const { send, isSending, chatMessages } = useChat()
  const transcriptions = useTranscriptions()

  const [history, setHistory] = useState<Array<LectureChatMessage>>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsHistoryLoading(true)
    setHistoryError(null)
    fetchAiTutorTranscriptRequest(lectureId)
      .then(sessions => {
        if (cancelled) return
        setHistory(transcriptSessionsToMessages(sessions))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setHistoryError(
          error instanceof Error ? error.message : 'AI_TUTOR_UNKNOWN_ERROR',
        )
      })
      .finally(() => {
        if (!cancelled) setIsHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lectureId, refetchKey, historyVersion])

  const liveText = useMemo(
    () => liveTextChatToMessages(chatMessages),
    [chatMessages],
  )
  const liveVoice = useMemo(
    () => liveTranscriptsToMessages(transcriptions),
    [transcriptions],
  )

  const messages = useMemo(
    () => mergeChatMessages(history, liveText, liveVoice),
    [history, liveText, liveVoice],
  )

  return {
    messages,
    isHistoryLoading,
    historyError,
    send: async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      await send(trimmed)
    },
    isSending,
    refetchHistory: () => setHistoryVersion(v => v + 1),
  }
}
