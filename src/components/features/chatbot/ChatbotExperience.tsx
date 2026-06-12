import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SessionProvider, useSession } from '@livekit/components-react'
import { TokenSource } from 'livekit-client'
import type { ChatMode, DisplayMessage, SessionSummary, StoredMessage } from '@/components/features/chatbot/types'
import { ChatPanel } from '@/components/features/chatbot/components/ChatPanel'
import { ChatbotHistoryHeader } from '@/components/features/chatbot/components/ChatbotHistoryHeader'
import { ChatbotHistoryPanel } from '@/components/features/chatbot/components/ChatbotHistoryPanel'
import { ChatbotPreSessionView } from '@/components/features/chatbot/components/ChatbotPreSessionView'
import { ChatbotSlideContainer } from '@/components/features/chatbot/components/ChatbotSlideContainer'
import {
  createChatbotSession,
  createChatbotToken,
  getChatbotSessionMessages,
  listChatbotSessions,
  patchChatbotSession,
} from '@/lib/api/chatbot/chatbotApi'
import { refreshSessionMessages } from '@/components/features/chatbot/utils/refreshMessages'
import {
  chatbotErrorBannerClass,
  chatbotInfoBannerClass,
  chatbotMainClass,
  chatbotShellClass,
} from '@/components/features/chatbot/chatbotUi'
import { cn } from '@/lib/utils'

const AGENT_NAME = 'chat-agent'

type ChatSessionProps = {
  lectureId: number
  sessionId: string
  mode: ChatMode
  historicalMessages: Array<StoredMessage>
  optimisticMessages: Array<DisplayMessage>
  isSwitchingMode: boolean
  onSessionsChange: () => void
  onModeChange: (mode: ChatMode) => void | Promise<void>
  pendingMessage?: string | null
  onPendingMessageSent?: () => void
}

function ChatSession({
  lectureId,
  sessionId,
  mode,
  historicalMessages,
  optimisticMessages,
  isSwitchingMode,
  onSessionsChange,
  onModeChange,
  pendingMessage,
  onPendingMessageSent,
}: ChatSessionProps) {
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const sessionRef = useRef<ReturnType<typeof useSession> | null>(null)

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const data = await createChatbotToken({ lectureId, mode, sessionId })
        return { serverUrl: data.serverUrl, participantToken: data.participantToken }
      }),
    [lectureId, mode, sessionId],
  )

  const session = useSession(tokenSource, { agentName: AGENT_NAME })
  sessionRef.current = session

  const handleConnect = useCallback(async () => {
    const lkSession = sessionRef.current
    if (!lkSession || lkSession.isConnected) {
      return
    }
    setError(null)
    setIsConnecting(true)
    try {
      await lkSession.start({
        tracks: { microphone: { enabled: mode === 'voice' } },
      })
      await patchChatbotSession(lectureId, sessionId, { lastMode: mode })
      onSessionsChange()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }, [lectureId, mode, onSessionsChange, sessionId])

  const handleVoiceModeToggle = useCallback(async () => {
    const nextMode = mode === 'voice' ? 'text' : 'voice'
    if (nextMode === mode || isSwitchingMode) {
      return
    }
    const lkSession = sessionRef.current
    if (lkSession?.isConnected) {
      await lkSession.end()
    }
    await onModeChange(nextMode)
  }, [isSwitchingMode, mode, onModeChange])

  useEffect(() => {
    if (isSwitchingMode) {
      return
    }
    const lkSession = sessionRef.current
    if (!lkSession || lkSession.isConnected) {
      return
    }

    const abortController = new AbortController()
    const connect = async () => {
      setError(null)
      setIsConnecting(true)
      try {
        await lkSession.start({
          signal: abortController.signal,
          tracks: { microphone: { enabled: mode === 'voice' } },
        })
        await patchChatbotSession(lectureId, sessionId, { lastMode: mode })
        onSessionsChange()
      } catch (error) {
        if (!abortController.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Failed to connect')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsConnecting(false)
        }
      }
    }

    void connect()
    return () => abortController.abort()
  }, [isSwitchingMode, lectureId, mode, onSessionsChange, sessionId])

  useEffect(() => {
    return () => {
      void sessionRef.current?.end()
    }
  }, [sessionId])

  const isBusy = isConnecting || isSwitchingMode

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-0 flex-1 flex-col">
        {isSwitchingMode && (
          <div className={cn(chatbotInfoBannerClass, 'mx-3 mt-2 shrink-0')}>
            Switching to {mode === 'voice' ? 'voice' : 'text'} mode...
          </div>
        )}
        <ChatPanel
          lectureId={lectureId}
          mode={mode}
          sessionId={sessionId}
          historicalMessages={historicalMessages}
          optimisticMessages={optimisticMessages}
          isConnecting={isBusy}
          isSwitchingMode={isSwitchingMode}
          connectionError={error}
          onRetryConnect={handleConnect}
          pendingMessage={pendingMessage}
          onPendingMessageSent={onPendingMessageSent}
          onVoiceModeToggle={handleVoiceModeToggle}
        />
      </div>
    </SessionProvider>
  )
}

type ChatbotExperienceProps = {
  lectureId: number
}

export function ChatbotExperience({
  lectureId,
}: ChatbotExperienceProps) {
  const [sessions, setSessions] = useState<Array<SessionSummary>>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [historicalMessages, setHistoricalMessages] = useState<Array<StoredMessage>>([])
  const [mode, setMode] = useState<ChatMode>('voice')
  const [isSwitchingMode, setIsSwitchingMode] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [optimisticMessages, setOptimisticMessages] = useState<Array<DisplayMessage>>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const hasAutoLoadedSessionRef = useRef(false)

  const refreshSessions = useCallback(async () => {
    try {
      const list = await listChatbotSessions(lectureId)
      setSessions(list)
    } catch (error) {
      console.error('[chatbot-sessions]', error)
    }
  }, [lectureId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSessionsLoading(true)
      try {
        const list = await listChatbotSessions(lectureId)
        if (!cancelled) {
          setSessions(list)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load sessions')
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lectureId])

  const loadSession = useCallback(
    async (sessionId: string) => {
      setLoadError(null)
      setOptimisticMessages([])
      setPendingMessage(null)
      const messages = await getChatbotSessionMessages(lectureId, sessionId)
      setHistoricalMessages(messages)
      setMode('voice')
      // setActiveSessionId(sessionId)
      setIsSwitchingMode(false)
    },
    [lectureId],
  )

  useEffect(() => {
    if (
      activeSessionId ||
      sessionsLoading ||
      sessions.length === 0 ||
      hasAutoLoadedSessionRef.current
    ) {
      return
    }
    hasAutoLoadedSessionRef.current = true
    void loadSession(sessions[0].sessionId)
  }, [activeSessionId, loadSession, sessions, sessionsLoading])

  const handleNewChat = useCallback(async () => {
    setLoadError(null)
    setPendingMessage(null)
    setOptimisticMessages([])
    setActiveSessionId(null)
    setHistoricalMessages([])
    setIsCreatingSession(false)
    setIsSwitchingMode(false)
  }, [])

  const handleStartVoiceSession = useCallback(async () => {
    setLoadError(null)
    setPendingMessage(null)
    setOptimisticMessages([])
    setIsCreatingSession(true)
    try {
      const session = await createChatbotSession(lectureId, 'voice')
      setSessions((prev) => [session, ...prev.filter((item) => item.sessionId !== session.sessionId)])
      setActiveSessionId(session.sessionId)
      setHistoricalMessages([])
      setMode('voice')
      setIsSwitchingMode(false)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to create session')
    } finally {
      setIsCreatingSession(false)
    }
  }, [lectureId])

  const handleStartWithText = useCallback(
    async (text: string) => {
      setLoadError(null)
      setOptimisticMessages([
        { id: `optimistic-${Date.now()}`, role: 'user', content: text },
      ])
      setPendingMessage(text)
      setIsCreatingSession(true)
      try {
        const session = await createChatbotSession(lectureId, 'text')
        setSessions((prev) => [session, ...prev.filter((item) => item.sessionId !== session.sessionId)])
        setMode('text')
        setActiveSessionId(session.sessionId)
        setHistoricalMessages([])
        setIsSwitchingMode(false)
      } catch (error) {
        setOptimisticMessages([])
        setPendingMessage(null)
        setLoadError(error instanceof Error ? error.message : 'Failed to create session')
      } finally {
        setIsCreatingSession(false)
      }
    },
    [lectureId],
  )

  const handlePendingMessageSent = useCallback(() => {
    setPendingMessage(null)
    setOptimisticMessages([])
  }, [])

  const handleModeChange = useCallback(
    async (nextMode: ChatMode) => {
      if (!activeSessionId) {
        setMode(nextMode)
        return
      }
      if (nextMode === mode) {
        return
      }

      setIsSwitchingMode(true)
      setMode(nextMode)
      try {
        const messages = await refreshSessionMessages(lectureId, activeSessionId)
        setHistoricalMessages(messages)
        await patchChatbotSession(lectureId, activeSessionId, { lastMode: nextMode })
        await refreshSessions()
      } catch (error) {
        console.error('[chatbot-mode]', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to switch mode')
      } finally {
        setIsSwitchingMode(false)
      }
    },
    [activeSessionId, lectureId, mode, refreshSessions],
  )

  return (

    <div className={chatbotShellClass}>
      <main className={cn(chatbotMainClass, 'flex min-h-0 flex-1 flex-col')}>
        {loadError && <div className={chatbotErrorBannerClass}>{loadError}</div>}
        <ChatbotSlideContainer
          isSecondaryOpen={isHistoryOpen}
          primary={
            <>
              <ChatbotHistoryHeader onOpenHistory={() => setIsHistoryOpen(true)} />
              <div className="flex min-h-0 flex-1 flex-col">
                {!activeSessionId ? (
                  <ChatbotPreSessionView
                    optimisticMessages={optimisticMessages}
                    onStartWithText={handleStartWithText}
                    onStartWithVoice={handleStartVoiceSession}
                    isCreating={isCreatingSession}
                  />
                ) : (
                  <ChatSession
                    key={activeSessionId}
                    lectureId={lectureId}
                    sessionId={activeSessionId}
                    mode={mode}
                    historicalMessages={historicalMessages}
                    optimisticMessages={optimisticMessages}
                    isSwitchingMode={isSwitchingMode}
                    onSessionsChange={refreshSessions}
                    onModeChange={handleModeChange}
                    pendingMessage={pendingMessage}
                    onPendingMessageSent={handlePendingMessageSent}
                  />
                )}
              </div>
            </>
          }
          secondary={
            <ChatbotHistoryPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              loading={sessionsLoading}
              onBack={() => setIsHistoryOpen(false)}
              onNewChat={handleNewChat}
              onSelect={loadSession}
            />
          }
        />
      </main>
    </div>

  )
}

