import type { TextStreamData } from '@livekit/components-core'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getLiveVoiceSubtitle,
  getVoiceSubtitleSwitchTarget,
  resolveInitialVoiceDisplayRole,
  VOICE_SUBTITLE_SWITCH_MS,
  type VoiceActiveSpeaker,
  type VoiceSubtitle,
} from '@/components/features/chatbot/utils/voiceSubtitle'

type HeldSubtitles = Record<VoiceActiveSpeaker, VoiceSubtitle | null>

const EMPTY_HELD: HeldSubtitles = { user: null, assistant: null }

export function useVoiceSubtitle(
  transcriptions: TextStreamData[],
  localIdentity: string | undefined,
  userSpeaking: boolean,
  agentSpeaking: boolean,
): VoiceSubtitle | null {
  const [displayRole, setDisplayRole] = useState<VoiceActiveSpeaker | null>(null)
  const heldRef = useRef<HeldSubtitles>({ ...EMPTY_HELD })
  const latchRef = useRef<Record<VoiceActiveSpeaker, string | null>>({ user: null, assistant: null })
  const pendingSwitchRef = useRef<{
    target: VoiceActiveSpeaker
    timer: ReturnType<typeof setTimeout>
  } | null>(null)
  const trackedSwitchTargetRef = useRef<VoiceActiveSpeaker | null>(null)
  const signalsRef = useRef({
    displayRole,
    userSpeaking,
    agentSpeaking,
    transcriptions,
    localIdentity,
  })

  signalsRef.current = {
    displayRole,
    userSpeaking,
    agentSpeaking,
    transcriptions,
    localIdentity,
  }

  const liveUser = useMemo(
    () => getLiveVoiceSubtitle(transcriptions, localIdentity, 'user', latchRef.current.user),
    [localIdentity, transcriptions],
  )
  const liveAssistant = useMemo(
    () =>
      getLiveVoiceSubtitle(transcriptions, localIdentity, 'assistant', latchRef.current.assistant),
    [localIdentity, transcriptions],
  )

  useEffect(() => {
    if (liveUser) {
      heldRef.current.user = liveUser
      latchRef.current.user = liveUser.streamId
    }
    if (liveAssistant) {
      heldRef.current.assistant = liveAssistant
      latchRef.current.assistant = liveAssistant.streamId
    }
  }, [liveAssistant, liveUser])

  useEffect(() => {
    if (displayRole) {
      return
    }
    const initialRole = resolveInitialVoiceDisplayRole(
      userSpeaking,
      agentSpeaking,
      transcriptions,
      localIdentity,
    )
    if (initialRole) {
      setDisplayRole(initialRole)
    }
  }, [agentSpeaking, displayRole, localIdentity, transcriptions, userSpeaking])

  useEffect(() => {
    const clearPendingSwitch = () => {
      if (pendingSwitchRef.current) {
        clearTimeout(pendingSwitchRef.current.timer)
        pendingSwitchRef.current = null
      }
      trackedSwitchTargetRef.current = null
    }

    if (!displayRole) {
      clearPendingSwitch()
      return
    }

    const switchTarget = getVoiceSubtitleSwitchTarget(
      displayRole,
      userSpeaking,
      agentSpeaking,
      transcriptions,
      localIdentity,
    )

    if (!switchTarget) {
      clearPendingSwitch()
      return
    }

    if (trackedSwitchTargetRef.current === switchTarget && pendingSwitchRef.current) {
      return
    }

    clearPendingSwitch()
    trackedSwitchTargetRef.current = switchTarget

    const timer = setTimeout(() => {
      const latest = signalsRef.current
      if (!latest.displayRole) {
        pendingSwitchRef.current = null
        trackedSwitchTargetRef.current = null
        return
      }

      const confirmedTarget = getVoiceSubtitleSwitchTarget(
        latest.displayRole,
        latest.userSpeaking,
        latest.agentSpeaking,
        latest.transcriptions,
        latest.localIdentity,
      )
      if (confirmedTarget === switchTarget) {
        setDisplayRole(switchTarget)
        latchRef.current[switchTarget] = null
      }
      pendingSwitchRef.current = null
      trackedSwitchTargetRef.current = null
    }, VOICE_SUBTITLE_SWITCH_MS)

    pendingSwitchRef.current = { target: switchTarget, timer }
  }, [agentSpeaking, displayRole, localIdentity, transcriptions, userSpeaking])

  useEffect(
    () => () => {
      if (pendingSwitchRef.current) {
        clearTimeout(pendingSwitchRef.current.timer)
        pendingSwitchRef.current = null
      }
    },
    [],
  )

  return useMemo(() => {
    if (!displayRole) {
      return liveUser ?? liveAssistant ?? null
    }

    const live = displayRole === 'user' ? liveUser : liveAssistant
    if (live) {
      return live
    }

    return heldRef.current[displayRole]
  }, [displayRole, liveAssistant, liveUser])
}
