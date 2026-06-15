import type { TextStreamData } from '@livekit/components-core'
import { isTranscriptionFinal } from '@/components/features/chatbot/utils/transcriptionFinal'

export type VoiceSubtitle = {
  role: 'user' | 'assistant'
  text: string
  streamId: string
}

export type VoiceActiveSpeaker = 'user' | 'assistant'

export const VOICE_SUBTITLE_SWITCH_MS = 400

export function isAgentParticipant(identity: string, localIdentity: string): boolean {
  if (identity === localIdentity) {
    return false
  }
  return /agent|tutor|ai/i.test(identity)
}

export function resolveVoiceActiveSpeaker(
  userSpeaking: boolean,
  agentSpeaking: boolean,
): VoiceActiveSpeaker | null {
  if (userSpeaking) {
    return 'user'
  }
  if (agentSpeaking) {
    return 'assistant'
  }
  return null
}

function matchesSpeaker(
  identity: string,
  localIdentity: string,
  activeSpeaker: VoiceActiveSpeaker,
): boolean {
  const isAgent = isAgentParticipant(identity, localIdentity)
  return activeSpeaker === 'assistant' ? isAgent : !isAgent
}

function toSubtitle(stream: TextStreamData, role: VoiceActiveSpeaker): VoiceSubtitle {
  return {
    role,
    text: stream.text.trim(),
    streamId: stream.streamInfo.id,
  }
}

function pickLatestStream(streams: TextStreamData[]): TextStreamData {
  return streams.reduce((best, current) =>
    current.streamInfo.timestamp >= best.streamInfo.timestamp ? current : best,
  )
}

function inProgressStreamsForRole(
  transcriptions: TextStreamData[],
  localIdentity: string,
  role: VoiceActiveSpeaker,
): TextStreamData[] {
  return transcriptions.filter((stream) => {
    const text = stream.text.trim()
    if (!text || isTranscriptionFinal(stream)) {
      return false
    }
    return matchesSpeaker(stream.participantInfo.identity, localIdentity, role)
  })
}

export function getLiveVoiceSubtitle(
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
  role: VoiceActiveSpeaker,
  latchedStreamId: string | null = null,
): VoiceSubtitle | null {
  if (!localIdentity) {
    return null
  }

  const inProgress = inProgressStreamsForRole(transcriptions, localIdentity, role)

  if (latchedStreamId) {
    const latched = inProgress.find((stream) => stream.streamInfo.id === latchedStreamId)
    if (latched) {
      return toSubtitle(latched, role)
    }
  }

  if (inProgress.length === 0) {
    return null
  }

  return toSubtitle(pickLatestStream(inProgress), role)
}

export function hasLiveVoiceTranscript(
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
  role: VoiceActiveSpeaker,
): boolean {
  if (!localIdentity) {
    return false
  }
  return inProgressStreamsForRole(transcriptions, localIdentity, role).length > 0
}

export function isVoicePartyActive(
  role: VoiceActiveSpeaker,
  userSpeaking: boolean,
  agentSpeaking: boolean,
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
): boolean {
  if (role === 'user') {
    return userSpeaking || hasLiveVoiceTranscript(transcriptions, localIdentity, 'user')
  }
  return agentSpeaking || hasLiveVoiceTranscript(transcriptions, localIdentity, 'assistant')
}

export function getVoiceSubtitleSwitchTarget(
  displayRole: VoiceActiveSpeaker,
  userSpeaking: boolean,
  agentSpeaking: boolean,
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
): VoiceActiveSpeaker | null {
  const userActive = isVoicePartyActive('user', userSpeaking, agentSpeaking, transcriptions, localIdentity)
  const assistantActive = isVoicePartyActive(
    'assistant',
    userSpeaking,
    agentSpeaking,
    transcriptions,
    localIdentity,
  )

  if (displayRole === 'user' && assistantActive && !userActive) {
    return 'assistant'
  }

  if (displayRole === 'assistant' && userActive && !assistantActive) {
    return 'user'
  }

  return null
}

export function resolveInitialVoiceDisplayRole(
  userSpeaking: boolean,
  agentSpeaking: boolean,
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
): VoiceActiveSpeaker | null {
  const userActive = isVoicePartyActive('user', userSpeaking, agentSpeaking, transcriptions, localIdentity)
  const assistantActive = isVoicePartyActive(
    'assistant',
    userSpeaking,
    agentSpeaking,
    transcriptions,
    localIdentity,
  )

  if (userActive && !assistantActive) {
    return 'user'
  }
  if (assistantActive && !userActive) {
    return 'assistant'
  }
  if (userActive) {
    return 'user'
  }
  if (assistantActive) {
    return 'assistant'
  }
  return null
}

/** @deprecated Use getLiveVoiceSubtitle */
export function selectActiveVoiceSubtitle(
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
  activeSpeaker: VoiceActiveSpeaker | null,
  latchedStreamId: string | null = null,
): VoiceSubtitle | null {
  if (!activeSpeaker) {
    return null
  }
  return getLiveVoiceSubtitle(transcriptions, localIdentity, activeSpeaker, latchedStreamId)
}
