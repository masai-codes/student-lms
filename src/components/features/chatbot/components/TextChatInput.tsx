import { useEffect, useState } from 'react'
import type { useAgent, useSessionMessages } from '@livekit/components-react'
import { ChatbotComposer } from '@/components/features/chatbot/components/ChatbotComposer'
import { chatbotErrorBannerClass } from '@/components/features/chatbot/chatbotUi'

type TextChatInputProps = {
  agent: ReturnType<typeof useAgent>
  send: ReturnType<typeof useSessionMessages>['send']
  isSending: boolean
  isRoomConnected: boolean
  isConnecting: boolean
  pendingMessage?: string | null
  onPendingMessageSent?: () => void
  placeholder?: string
  isVoiceActive?: boolean
  onVoiceActivate?: () => void
}

export function TextChatInput({
  agent,
  send,
  isSending,
  isRoomConnected,
  isConnecting,
  pendingMessage,
  onPendingMessageSent,
  placeholder,
  isVoiceActive = false,
  onVoiceActivate,
}: TextChatInputProps) {
  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  const agentReady =
    agent.state === 'listening' ||
    agent.state === 'thinking' ||
    agent.state === 'speaking' ||
    agent.state === 'idle' ||
    agent.state === 'initializing'

  const canSend = isRoomConnected && agentReady && !isConnecting

  useEffect(() => {
    if (!pendingMessage || !canSend || isSending) {
      return
    }

    let cancelled = false
    const sendPending = async () => {
      try {
        await send(pendingMessage, { topic: 'lk.chat' })
        if (!cancelled) {
          onPendingMessageSent?.()
        }
      } catch (error) {
        if (!cancelled) {
          setSendError(error instanceof Error ? error.message : 'Failed to send message')
        }
      }
    }

    void sendPending()
    return () => {
      cancelled = true
    }
  }, [canSend, isSending, onPendingMessageSent, pendingMessage, send])

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text || isSending || !canSend) {
      return
    }

    setSendError(null)
    setInput('')
    try {
      await send(text, { topic: 'lk.chat' })
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message')
      setInput(text)
    }
  }

  return (
    <div>
      {sendError && <div className={chatbotErrorBannerClass}>{sendError}</div>}
      <ChatbotComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSubmit()}
        onVoiceActivate={onVoiceActivate}
        isVoiceActive={isVoiceActive}
        disabled={!canSend}
        voiceDisabled={isConnecting}
        isSending={isSending}
        isConnecting={isConnecting}
        placeholder={
          placeholder ??
          (!isRoomConnected
            ? 'Connecting to room...'
            : agentReady
              ? 'Ask about the lecture...'
              : 'Waiting for assistant...')
        }
      />
    </div>
  )
}
