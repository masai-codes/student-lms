'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAiTutorAgentSpeaking } from './useAiTutorAgentSpeaking'
import { useAiTutorMessages } from './useAiTutorMessages'
import { useAiTutorMic } from './useAiTutorMic'
import { useAiTutorSession } from './useAiTutorSession'
import type { AiTutorSessionState, LectureChatMessage } from '../types'

type UseLectureAiChatOptions = {
  lectureId: number
  language?: string
  defaultExpanded?: boolean
}

export type UseLectureAiChatResult = {
  isExpanded: boolean
  isSending: boolean
  inputValue: string
  messages: Array<LectureChatMessage>
  sessionState: AiTutorSessionState
  agentJoined: boolean
  isAgentSpeaking: boolean
  errorCode: string | null
  isHistoryLoading: boolean
  isMicEnabled: boolean
  isMicPending: boolean
  open: () => void
  close: () => void
  setInputValue: (value: string) => void
  sendMessage: () => Promise<void>
  toggleMic: () => Promise<void>
  endSession: () => Promise<void>
}

export function useLectureAiChat({
  lectureId,
  language = 'English',
  defaultExpanded = false,
}: UseLectureAiChatOptions): UseLectureAiChatResult {
  const [isExpanded, setIsExpanded] = useState(() => defaultExpanded)
  const [inputValue, setInputValue] = useState('')

  const session = useAiTutorSession({ lectureId, language })
  const chat = useAiTutorMessages({
    lectureId,
    refetchKey: session.session?.sessionId ?? 'idle',
  })
  const mic = useAiTutorMic({ ensureConnected: session.ensureConnected })
  const isAgentSpeaking = useAiTutorAgentSpeaking()

  const open = useCallback(() => setIsExpanded(true), [])
  const close = useCallback(() => setIsExpanded(false), [])

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || chat.isSending) return

    const ok = await session.ensureConnected()
    if (!ok) return

    setInputValue('')
    try {
      await chat.send(text)
    } catch {
      setInputValue(text)
    }
  }, [chat, inputValue, session])

  const endSession = useCallback(async () => {
    await session.endSession()
  }, [session])

  useEffect(() => {
    if (!isExpanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExpanded, close])

  return {
    isExpanded,
    isSending:
      chat.isSending ||
      session.state === 'creating' ||
      session.state === 'connecting',
    inputValue,
    messages: chat.messages,
    sessionState: session.state,
    agentJoined: session.agentJoined,
    isAgentSpeaking,
    errorCode: session.errorCode,
    isHistoryLoading: chat.isHistoryLoading,
    isMicEnabled: mic.isMicEnabled,
    isMicPending: mic.isMicPending,
    open,
    close,
    setInputValue,
    sendMessage,
    toggleMic: mic.toggleMic,
    endSession,
  }
}
