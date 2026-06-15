import type { TextStreamData } from '@livekit/components-core'
import { Encryption_Type } from '@livekit/protocol'
import { describe, expect, it } from 'vitest'
import {
  getLiveVoiceSubtitle,
  getVoiceSubtitleSwitchTarget,
  hasLiveVoiceTranscript,
  isAgentParticipant,
  isVoicePartyActive,
  resolveInitialVoiceDisplayRole,
  resolveVoiceActiveSpeaker,
} from '@/components/features/chatbot/utils/voiceSubtitle'

type StreamInput = {
  text: string
  identity: string
  id: string
  timestamp: number
  final?: boolean
}

function stream(input: StreamInput): TextStreamData {
  return {
    text: input.text,
    participantInfo: { identity: input.identity },
    streamInfo: {
      id: input.id,
      timestamp: input.timestamp,
      topic: 'lk.transcription',
      mimeType: 'text/plain',
      size: input.text.length,
      encryptionType: Encryption_Type.NONE,
      attributes: input.final ? { 'lk.transcription_final': 'true' } : {},
    },
  }
}

describe('isAgentParticipant', () => {
  it('returns false for the local participant', () => {
    expect(isAgentParticipant('student-1', 'student-1')).toBe(false)
  })

  it('returns true for agent-like identities', () => {
    expect(isAgentParticipant('chat-agent', 'student-1')).toBe(true)
    expect(isAgentParticipant('ai-tutor', 'student-1')).toBe(true)
  })
})

describe('resolveVoiceActiveSpeaker', () => {
  it('prioritizes the user when both speakers are active', () => {
    expect(resolveVoiceActiveSpeaker(true, true)).toBe('user')
  })

  it('returns null when nobody is speaking', () => {
    expect(resolveVoiceActiveSpeaker(false, false)).toBeNull()
  })
})

describe('getLiveVoiceSubtitle', () => {
  it('returns the latest in-progress transcript for the active speaker', () => {
    const transcripts = [
      stream({
        text: 'older',
        identity: 'student-1',
        id: 'u1',
        timestamp: 1,
        final: true,
      }),
      stream({
        text: 'latest user words',
        identity: 'student-1',
        id: 'u2',
        timestamp: 3,
      }),
      stream({
        text: 'assistant line',
        identity: 'chat-agent',
        id: 'a1',
        timestamp: 2,
      }),
    ]

    expect(getLiveVoiceSubtitle(transcripts, 'student-1', 'user')).toEqual({
      role: 'user',
      text: 'latest user words',
      streamId: 'u2',
    })
  })

  it('ignores finalized transcripts', () => {
    const transcripts = [
      stream({
        text: 'Hello there',
        identity: 'chat-agent',
        id: 'a1',
        timestamp: 1,
        final: true,
      }),
    ]

    expect(getLiveVoiceSubtitle(transcripts, 'student-1', 'assistant')).toBeNull()
  })

  it('keeps the latched in-progress stream stable', () => {
    const transcripts = [
      stream({
        text: 'current chunk',
        identity: 'chat-agent',
        id: 'a-current',
        timestamp: 2,
      }),
      stream({
        text: 'newer other stream',
        identity: 'chat-agent',
        id: 'a-new',
        timestamp: 3,
      }),
    ]

    expect(
      getLiveVoiceSubtitle(transcripts, 'student-1', 'assistant', 'a-current'),
    ).toEqual({
      role: 'assistant',
      text: 'current chunk',
      streamId: 'a-current',
    })
  })
})

describe('isVoicePartyActive', () => {
  it('detects live transcripts and speaking state', () => {
    const transcripts = [
      stream({
        text: 'Hi',
        identity: 'chat-agent',
        id: 'a1',
        timestamp: 1,
      }),
    ]

    expect(
      isVoicePartyActive('assistant', false, false, transcripts, 'student-1'),
    ).toBe(true)
    expect(isVoicePartyActive('user', true, false, [], 'student-1')).toBe(true)
    expect(isVoicePartyActive('user', false, false, [], 'student-1')).toBe(false)
  })
})

describe('getVoiceSubtitleSwitchTarget', () => {
  const localIdentity = 'student-1'

  it('holds the user card until assistant chunks arrive', () => {
    const assistantChunks = [
      stream({
        text: 'Sure',
        identity: 'chat-agent',
        id: 'a1',
        timestamp: 1,
      }),
    ]

    expect(
      getVoiceSubtitleSwitchTarget('user', false, false, [], localIdentity),
    ).toBeNull()
    expect(
      getVoiceSubtitleSwitchTarget('user', false, false, assistantChunks, localIdentity),
    ).toBe('assistant')
  })

  it('holds the assistant card until user speech is detected', () => {
    expect(
      getVoiceSubtitleSwitchTarget('assistant', false, false, [], localIdentity),
    ).toBeNull()
    expect(
      getVoiceSubtitleSwitchTarget('assistant', true, false, [], localIdentity),
    ).toBe('user')
  })

  it('does not switch while both parties are active', () => {
    const transcripts = [
      stream({
        text: 'overlap',
        identity: 'chat-agent',
        id: 'a1',
        timestamp: 1,
      }),
    ]

    expect(
      getVoiceSubtitleSwitchTarget('user', true, true, transcripts, localIdentity),
    ).toBeNull()
    expect(
      getVoiceSubtitleSwitchTarget('assistant', true, true, transcripts, localIdentity),
    ).toBeNull()
  })
})

describe('hasLiveVoiceTranscript', () => {
  it('returns false when only finalized transcripts exist', () => {
    const transcripts = [
      stream({
        text: 'done',
        identity: 'student-1',
        id: 'u1',
        timestamp: 1,
        final: true,
      }),
    ]

    expect(hasLiveVoiceTranscript(transcripts, 'student-1', 'user')).toBe(false)
  })
})

describe('resolveInitialVoiceDisplayRole', () => {
  it('picks a single active party immediately', () => {
    expect(resolveInitialVoiceDisplayRole(true, false, [], 'student-1')).toBe('user')
    expect(resolveInitialVoiceDisplayRole(false, true, [], 'student-1')).toBe('assistant')
  })
})
