import type { ReceivedMessage } from '@livekit/components-react'
import type { TextStreamData } from '@livekit/components-core'
import { useEffect, useMemo, useRef } from 'react'
import { appendChatbotSessionMessage } from '@/lib/api/chatbot/chatbotApi'
import { buildFinalByStreamId } from '@/components/features/chatbot/utils/transcriptionFinal'
import {
  filterMessagesForPersistence,
  toPersistPayload,
  type PersistPayload,
} from '@/components/features/chatbot/utils/persistMessages'

const TRANSCRIPT_SETTLE_MS = 700
const CHAT_SETTLE_MS = 150

function persistKey(payload: PersistPayload, index: number): string {
  return payload.livekitId ?? `${payload.sourceType}-${payload.role}-${index}`
}

function settleDelay(payload: PersistPayload, finalByStreamId: Map<string, boolean>): number {
  if (payload.sourceType === 'chatMessage') {
    return CHAT_SETTLE_MS
  }
  if (
    payload.livekitId &&
    (payload.sourceType === 'userTranscript' || payload.sourceType === 'agentTranscript')
  ) {
    if (finalByStreamId.get(payload.livekitId)) {
      return 0
    }
    return TRANSCRIPT_SETTLE_MS
  }
  return TRANSCRIPT_SETTLE_MS
}

export function usePersistedMessages(
  lectureId: number,
  sessionId: string | null,
  messages: ReceivedMessage[],
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
  enabled: boolean,
): void {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastPersistedContentRef = useRef<Map<string, string>>(new Map())
  const finalByStreamId = useMemo(
    () => buildFinalByStreamId(transcriptions),
    [transcriptions],
  )

  useEffect(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    lastPersistedContentRef.current.clear()
  }, [sessionId])

  useEffect(() => {
    if (!enabled || !sessionId || !localIdentity) {
      return
    }

    const filtered = filterMessagesForPersistence(messages, localIdentity)
    const activeKeys = new Set<string>()

    filtered.forEach((message, index) => {
      const payload = toPersistPayload(message, localIdentity)
      if (!payload) {
        return
      }
      const key = persistKey(payload, index)
      activeKeys.add(key)

      const lastContent = lastPersistedContentRef.current.get(key)
      if (lastContent === payload.content) {
        return
      }

      const delay = settleDelay(payload, finalByStreamId)
      const existingTimer = timersRef.current.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(async () => {
        timersRef.current.delete(key)
        if (lastPersistedContentRef.current.get(key) === payload.content) {
          return
        }
        try {
          await appendChatbotSessionMessage(lectureId, sessionId, {
            role: payload.role,
            content: payload.content,
            sourceType: payload.sourceType,
            livekitId: payload.livekitId,
          })
          lastPersistedContentRef.current.set(key, payload.content)
        } catch (error) {
          console.error('[chatbot-persist]', error)
        }
      }, delay)

      timersRef.current.set(key, timer)
    })

    return () => {
      for (const [key, timer] of timersRef.current) {
        if (!activeKeys.has(key)) {
          clearTimeout(timer)
          timersRef.current.delete(key)
        }
      }
    }
  }, [enabled, finalByStreamId, lectureId, localIdentity, messages, sessionId])
}

