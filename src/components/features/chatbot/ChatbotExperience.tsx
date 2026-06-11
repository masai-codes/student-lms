import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SessionProvider, useSession } from '@livekit/components-react'
import { TokenSource } from 'livekit-client'
import { ChatPanel } from '@/components/features/chatbot/components/ChatPanel'
import { SessionSidebar } from '@/components/features/chatbot/components/SessionSidebar'
import type { ChatMode, SessionSummary, StoredMessage } from '@/components/features/chatbot/types'
import {
  createChatbotSession,
  createChatbotToken,
  getChatbotSessionMessages,
  listChatbotSessions,
  patchChatbotSession,
} from '@/lib/api/chatbot/chatbotApi'
import { refreshSessionMessages } from '@/components/features/chatbot/utils/refreshMessages'
import '@/components/features/chatbot/chatbot.css'

const AGENT_NAME = 'chat-agent'

type ChatSessionProps = {
  lectureId: number
  sessionId: string
  mode: ChatMode
  layout: 'page' | 'sidebar'
  historicalMessages: StoredMessage[]
  isSwitchingMode: boolean
  onModeChange: (mode: ChatMode) => void | Promise<void>
  onNewChat: () => void | Promise<void>
  onSessionsChange: () => void
}

function ChatSession({
  lectureId,
  sessionId,
  mode,
  layout,
  historicalMessages,
  isSwitchingMode,
  onModeChange,
  onNewChat,
  onSessionsChange,
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

  const handleModeSwitch = useCallback(
    async (nextMode: ChatMode) => {
      if (nextMode === mode || isSwitchingMode) {
        return
      }
      const lkSession = sessionRef.current
      if (lkSession?.isConnected) {
        await lkSession.end()
      }
      await onModeChange(nextMode)
    },
    [isSwitchingMode, mode, onModeChange],
  )

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
      <section className="chatbot-session-shell">
        <header className="chatbot-header">
          <div className="chatbot-header-title">
            <h2>Lecture assistant</h2>
            <p>Ask doubts from this lecture</p>
          </div>
          <div className="chatbot-header-actions">
            {layout === 'sidebar' ? (
              <button
                type="button"
                className="chatbot-btn"
                onClick={() => void onNewChat()}
                disabled={isSwitchingMode}
              >
                New
              </button>
            ) : null}
            <div className="chatbot-mode-toggle" role="group" aria-label="Chat mode">
              <button
                type="button"
                className={`chatbot-mode-toggle-btn ${mode === 'text' ? 'chatbot-mode-toggle-btn-active' : ''}`}
                disabled={isSwitchingMode}
                onClick={() => handleModeSwitch('text')}
              >
                Text
              </button>
              <button
                type="button"
                className={`chatbot-mode-toggle-btn ${mode === 'voice' ? 'chatbot-mode-toggle-btn-active' : ''}`}
                disabled={isSwitchingMode}
                onClick={() => handleModeSwitch('voice')}
              >
                Voice
              </button>
            </div>
          </div>
        </header>
        {isSwitchingMode && (
          <div className="chatbot-info-banner">
            Switching to {mode === 'voice' ? 'voice' : 'text'} mode...
          </div>
        )}
        <ChatPanel
          lectureId={lectureId}
          mode={mode}
          sessionId={sessionId}
          historicalMessages={historicalMessages}
          isConnecting={isBusy}
          isSwitchingMode={isSwitchingMode}
          connectionError={error}
          onRetryConnect={handleConnect}
        />
      </section>
    </SessionProvider>
  )
}

type ChatbotExperienceProps = {
  lectureId: number
  layout?: 'page' | 'sidebar'
}

export function ChatbotExperience({
  lectureId,
  layout = 'page',
}: ChatbotExperienceProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [historicalMessages, setHistoricalMessages] = useState<StoredMessage[]>([])
  const [mode, setMode] = useState<ChatMode>('voice')
  const [isSwitchingMode, setIsSwitchingMode] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refreshSessions = useCallback(async () => {
    try {
      const list = await listChatbotSessions(lectureId)
      setSessions(list)
    } catch (error) {
      console.error('[chatbot-sessions]', error)
    }
  }, [lectureId])

  const reloadHistoricalMessages = useCallback(
    async (sessionId: string, settle = false) => {
      const messages = settle
        ? await refreshSessionMessages(lectureId, sessionId)
        : await getChatbotSessionMessages(lectureId, sessionId)
      setHistoricalMessages(messages)
      return messages
    },
    [lectureId],
  )

  useEffect(() => {
    let cancelled = false
      ; (async () => {
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
      const messages = await getChatbotSessionMessages(lectureId, sessionId)
      setHistoricalMessages(messages)
      setMode('voice')
      setActiveSessionId(sessionId)
      setIsSwitchingMode(false)
    },
    [lectureId],
  )

  useEffect(() => {
    if (
      layout !== 'sidebar' ||
      activeSessionId ||
      sessionsLoading ||
      sessions.length === 0
    ) {
      return
    }
    void loadSession(sessions[0].sessionId)
  }, [activeSessionId, layout, loadSession, sessions, sessionsLoading])

  const handleNewChat = useCallback(async () => {
    setLoadError(null)
    try {
      const session = await createChatbotSession(lectureId, 'voice')
      setSessions((prev) => [session, ...prev.filter((item) => item.sessionId !== session.sessionId)])
      setActiveSessionId(session.sessionId)
      setHistoricalMessages([])
      setMode('voice')
      setIsSwitchingMode(false)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to create session')
    }
  }, [lectureId])

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
        const messages = await reloadHistoricalMessages(activeSessionId, true)
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
    [activeSessionId, lectureId, mode, refreshSessions, reloadHistoricalMessages],
  )

  const shellClassName =
    layout === 'sidebar' ? 'chatbot-shell-sidebar' : 'chatbot-shell'

  return (
    <div className={shellClassName}>
      {layout === 'page' ? (
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={sessionsLoading}
          onNewChat={handleNewChat}
          onSelect={loadSession}
        />
      ) : null}
      <main className="chatbot-main">
        {loadError && <div className="chatbot-error-banner">{loadError}</div>}
        {!activeSessionId ? (
          <div className="chatbot-welcome-panel">
            <h2>Ask about this lecture</h2>
            <p>
              Get help with concepts from the lecture transcript. Ask out loud by default and
              switch to text mode anytime.
            </p>
            <button type="button" className="chatbot-btn chatbot-btn-primary" onClick={handleNewChat}>
              Ask a question
            </button>
          </div>
        ) : (
          <ChatSession
            key={activeSessionId}
            lectureId={lectureId}
            sessionId={activeSessionId}
            mode={mode}
            layout={layout}
            historicalMessages={historicalMessages}
            isSwitchingMode={isSwitchingMode}
            onModeChange={handleModeChange}
            onNewChat={handleNewChat}
            onSessionsChange={refreshSessions}
          />
        )}
      </main>
    </div>
  )
}

