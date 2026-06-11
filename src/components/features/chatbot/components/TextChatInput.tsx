import { useState, type FormEvent } from 'react'
import type { useAgent, useSessionMessages } from '@livekit/components-react'

type TextChatInputProps = {
  agent: ReturnType<typeof useAgent>
  send: ReturnType<typeof useSessionMessages>['send']
  isSending: boolean
  isRoomConnected: boolean
  isConnecting: boolean
}

export function TextChatInput({
  agent,
  send,
  isSending,
  isRoomConnected,
  isConnecting,
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
  const placeholder = isConnecting
    ? 'Connecting to assistant...'
    : !isRoomConnected
      ? 'Connecting to room...'
      : agentReady
        ? 'Ask about the lecture...'
        : 'Waiting for assistant...'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
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
    <div className="chatbot-text-input">
      <p className="chatbot-agent-status">Agent: {agent.state}</p>
      {sendError && <div className="chatbot-error-banner">{sendError}</div>}
      <form className="chatbot-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          disabled={!canSend || isSending}
          autoFocus
        />
        <button
          type="submit"
          className="chatbot-btn chatbot-btn-primary"
          disabled={!input.trim() || isSending || !canSend}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

