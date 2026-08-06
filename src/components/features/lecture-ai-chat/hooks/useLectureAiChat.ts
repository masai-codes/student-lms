'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  readStoredAiLectureChatLanguage,
  writeStoredAiLectureChatLanguage,
} from '../languages'
import { lectureAiConversationsKey } from './useLectureAiConversations'
import type { AiLectureChatLanguage } from '../languages'
import type { LectureAiChatMessage } from '../types'
import type {
  LectureAiChatPlatform,
  StreamLectureAiChatRequest,
} from '@/lib/api/ai-tutor/streamAiTutorChat'
import {
  getAiTutorConversation,
  submitPracticeQuestionAnswers as submitPracticeQuestionAnswersRequest,
} from '@/lib/api/ai-tutor/aiTutorChatApi'
import { streamLectureAiChat } from '@/lib/api/ai-tutor/streamAiTutorChat'

let messageCounter = 0
function createMessageId(prefix: string): string {
  messageCounter += 1
  return `${prefix}-${Date.now()}-${messageCounter}`
}

export type UseLectureAiChatResult = {
  messages: Array<LectureAiChatMessage>
  input: string
  isSending: boolean
  isLoadingConversation: boolean
  activeChatId: number | null
  errorCode: string | null
  /** Language the assistant is asked to reply in; sent with each stream. */
  language: AiLectureChatLanguage
  setLanguage: (language: AiLectureChatLanguage) => void
  setInput: (value: string) => void
  /** Sends `text` if provided, otherwise the current input. */
  sendMessage: (text?: string) => void
  retryLast: () => void
  stop: () => void
  startNewChat: () => void
  /** Loads a past conversation and continues it (subsequent sends reuse its id). */
  selectConversation: (chatId: number) => Promise<void>
  /**
   * Persists a quiz's answers (question id -> chosen option id) and updates
   * the message locally so the quiz card reflects "answered" immediately.
   */
  submitPracticeQuestionAnswers: (
    messageId: string,
    quizId: string,
    answers: Record<string, string>,
  ) => void
}

/**
 * Owns the active chat thread against `POST /api/ai-tutor/chat/stream`.
 * Plain `useState`/`useRef` — only the conversation-history *list* is React
 * Query (see `useLectureAiConversations`), which this hook invalidates after
 * each completed stream.
 */
export function useLectureAiChat(
  lectureId: number,
  platform: LectureAiChatPlatform,
  onFirstReplyInNewThreadCompleted?: (chatId: number) => void,
): UseLectureAiChatResult {
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<Array<LectureAiChatMessage>>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  // Lazy init from localStorage so a returning learner keeps their last choice
  // (SSR-safe: falls back to the English default when window is unavailable).
  const [language, setLanguageState] = useState<AiLectureChatLanguage>(
    readStoredAiLectureChatLanguage,
  )

  const chatIdRef = useRef<number | null>(null)
  const cancelStreamRef = useRef<(() => void) | null>(null)
  const lastRequestRef = useRef<StreamLectureAiChatRequest | null>(null)
  const lastAssistantIdRef = useRef<string | null>(null)
  // Guards against a slow `selectConversation` overwriting a newer action.
  const selectGenerationRef = useRef(0)
  // True until a history thread is loaded; first-send eligibility for the
  // feedback prompt (docs/AI_CHAT_FEEDBACK.md) is derived from this.
  const isNewThreadRef = useRef(true)
  // Set on the send that starts a thread (chatIdRef was null beforehand), so
  // the *reply* to that specific send can be identified once it completes.
  const isFirstSendInThreadRef = useRef(false)

  const patchMessage = useCallback(
    (id: string, patch: Partial<LectureAiChatMessage>) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, ...patch } : message,
        ),
      )
    },
    [],
  )

  const setLanguage = useCallback((next: AiLectureChatLanguage) => {
    setLanguageState(next)
    writeStoredAiLectureChatLanguage(next)
  }, [])

  const runStream = useCallback(
    (request: StreamLectureAiChatRequest, assistantId: string) => {
      lastRequestRef.current = request
      lastAssistantIdRef.current = assistantId
      setErrorCode(null)
      setIsSending(true)

      cancelStreamRef.current = streamLectureAiChat(request, {
        onFirstChunk: () => {
          patchMessage(assistantId, { status: 'streaming', content: '' })
        },
        onChunk: (content) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    status: 'streaming',
                    content: message.content + content,
                  }
                : message,
            ),
          )
        },
        onPracticeQuestions: (payload) => {
          patchMessage(assistantId, {
            status: 'streaming',
            practiceQuestions: payload,
            practiceQuestionsJustGenerated: true,
          })
        },
        onComplete: (chatId) => {
          cancelStreamRef.current = null
          if (chatId != null) {
            chatIdRef.current = chatId
            setActiveChatId(chatId)
          }
          setIsSending(false)
          patchMessage(assistantId, { status: 'completed' })
          void queryClient.invalidateQueries({
            queryKey: lectureAiConversationsKey(lectureId),
          })

          if (
            chatId != null &&
            isFirstSendInThreadRef.current &&
            isNewThreadRef.current
          ) {
            onFirstReplyInNewThreadCompleted?.(chatId)
          }
          isFirstSendInThreadRef.current = false
        },
        onError: (code) => {
          cancelStreamRef.current = null
          setIsSending(false)
          setErrorCode(code)
          patchMessage(assistantId, { status: 'error', content: '' })
        },
      })
    },
    [lectureId, onFirstReplyInNewThreadCompleted, patchMessage, queryClient],
  )

  const sendMessage = useCallback(
    (text?: string) => {
      const value = (text ?? input).trim()
      if (!value || isSending) return

      // A fresh send wins over any in-flight conversation load.
      selectGenerationRef.current += 1
      isFirstSendInThreadRef.current = chatIdRef.current == null

      const now = Date.now()
      const userMessage: LectureAiChatMessage = {
        id: createMessageId('user'),
        role: 'user',
        content: value,
        status: 'sent',
        createdAt: now,
      }
      const assistantMessage: LectureAiChatMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: '',
        status: 'thinking',
        createdAt: now + 1,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')

      runStream(
        {
          lectureId,
          chat: value,
          platform,
          language,
          ...(chatIdRef.current != null ? { chatId: chatIdRef.current } : {}),
        },
        assistantMessage.id,
      )
    },
    [input, isSending, language, lectureId, platform, runStream],
  )

  const retryLast = useCallback(() => {
    const request = lastRequestRef.current
    const assistantId = lastAssistantIdRef.current
    if (!request || !assistantId || isSending) return

    patchMessage(assistantId, { status: 'thinking', content: '' })
    runStream(
      {
        ...request,
        language,
        ...(chatIdRef.current != null ? { chatId: chatIdRef.current } : {}),
      },
      assistantId,
    )
  }, [isSending, language, patchMessage, runStream])

  const stop = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    setIsSending(false)
    setMessages((prev) =>
      prev.map((message) =>
        message.status === 'thinking' || message.status === 'streaming'
          ? { ...message, status: message.content ? 'completed' : 'error' }
          : message,
      ),
    )
  }, [])

  const startNewChat = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    selectGenerationRef.current += 1
    chatIdRef.current = null
    lastRequestRef.current = null
    lastAssistantIdRef.current = null
    isNewThreadRef.current = true
    isFirstSendInThreadRef.current = false
    setMessages([])
    setActiveChatId(null)
    setErrorCode(null)
    setIsSending(false)
    setIsLoadingConversation(false)
    setInput('')
  }, [])

  const selectConversation = useCallback(async (chatId: number) => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    const generation = ++selectGenerationRef.current
    isNewThreadRef.current = false
    isFirstSendInThreadRef.current = false
    setIsSending(false)
    setErrorCode(null)
    setIsLoadingConversation(true)

    try {
      const detail = await getAiTutorConversation(chatId)
      if (generation !== selectGenerationRef.current) return

      const mapped: Array<LectureAiChatMessage> = detail.chat.map(
        (turn, index) => ({
          id: `history-${chatId}-${index}`,
          role: turn.role,
          content: turn.content,
          status: turn.role === 'user' ? 'sent' : 'completed',
          createdAt: turn.createdAt ?? index,
          ...(turn.practiceQuestions
            ? { practiceQuestions: turn.practiceQuestions }
            : {}),
        }),
      )

      chatIdRef.current = chatId
      lastRequestRef.current = null
      lastAssistantIdRef.current = null
      setMessages(mapped)
      setActiveChatId(chatId)
    } catch {
      if (generation === selectGenerationRef.current) {
        setErrorCode('AI_TUTOR_CHAT_HISTORY_FAILED')
      }
    } finally {
      if (generation === selectGenerationRef.current) {
        setIsLoadingConversation(false)
      }
    }
  }, [])

  const submitPracticeQuestionAnswers = useCallback(
    (messageId: string, quizId: string, answers: Record<string, string>) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId && message.practiceQuestions
            ? {
                ...message,
                practiceQuestions: { ...message.practiceQuestions, answers },
              }
            : message,
        ),
      )

      const chatId = chatIdRef.current
      if (chatId == null) return
      void submitPracticeQuestionAnswersRequest({
        chatId,
        quizId,
        answers,
      }).catch(() => {
        // Best-effort persistence — the quiz already reflects the submitted
        // answers locally regardless of whether this call succeeds.
      })
    },
    [],
  )

  useEffect(() => {
    return () => {
      cancelStreamRef.current?.()
    }
  }, [])

  return {
    messages,
    input,
    isSending,
    isLoadingConversation,
    activeChatId,
    errorCode,
    language,
    setLanguage,
    setInput,
    sendMessage,
    retryLast,
    stop,
    startNewChat,
    selectConversation,
    submitPracticeQuestionAnswers,
  }
}
