// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockSetMicrophoneEnabled = vi.fn().mockResolvedValue(undefined)

vi.mock('@livekit/components-react', () => ({
  useSessionContext: () => ({
    room: {
      localParticipant: {
        setMicrophoneEnabled: mockSetMicrophoneEnabled,
      },
    },
  }),
  useLocalParticipant: () => ({
    localParticipant: {
      isMicrophoneEnabled: true,
    },
  }),
}))

vi.mock('@/components/common/AIAvatar', () => ({
  AIAvatar: ({ isSpeaking }: { isSpeaking?: boolean }) => (
    <div data-testid="ai-avatar" data-speaking={String(Boolean(isSpeaking))} />
  ),
}))

import { ChatbotVoiceControls } from './ChatbotVoiceControls'

describe('ChatbotVoiceControls', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders avatar and voice action buttons without a text input', () => {
    render(
      <ChatbotVoiceControls
        isSpeaking={false}
        isConnecting={false}
        onEndSession={vi.fn()}
      />,
    )

    expect(screen.getByTestId('ai-avatar')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'End voice session' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mute microphone' })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('passes speaking state to the avatar', () => {
    render(
      <ChatbotVoiceControls
        isSpeaking
        isConnecting={false}
        onEndSession={vi.fn()}
      />,
    )

    expect(screen.getByTestId('ai-avatar').getAttribute('data-speaking')).toBe('true')
  })

  it('calls end session and toggles the microphone', () => {
    const onEndSession = vi.fn()

    render(
      <ChatbotVoiceControls
        isSpeaking={false}
        isConnecting={false}
        onEndSession={onEndSession}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'End voice session' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mute microphone' }))

    expect(onEndSession).toHaveBeenCalledTimes(1)
    expect(mockSetMicrophoneEnabled).toHaveBeenCalledWith(false)
  })
})
