/**
 * Owns a single WebRTC connection straight from the browser to OpenAI's
 * Realtime API, authenticated with a short-lived client secret (never the
 * standing `OPENAI_API_KEY`) — no audio is proxied through our own server.
 * https://developers.openai.com/api/docs/guides/realtime-webrtc
 *
 * The transcript is built purely from `...transcription.delta` events as
 * they arrive; `...transcription.completed` is only used as a "this segment
 * is done" signal (its own transcript field, if present, isn't trusted —
 * whether it repeats the deltas or not isn't something we can confirm
 * without a live session, so re-adding it risks double-counting).
 */

const OPENAI_REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'
const STT_DATA_CHANNEL_LABEL = 'oai-events'
/** Safety net if `completed` never arrives after we commit — don't hang forever. */
const COMMIT_TIMEOUT_MS = 5_000

function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    function check() {
      if (pc.iceGatheringState !== 'complete') return
      pc.removeEventListener('icegatheringstatechange', check)
      resolve()
    }
    pc.addEventListener('icegatheringstatechange', check)
  })
}

export type LiveSttSession = {
  start: (mediaStream: MediaStream, clientSecret: string) => Promise<void>
  /** Signals end-of-turn and resolves with the accumulated transcript once
   * the in-flight segment finalizes (or the safety timeout elapses). */
  stop: () => Promise<string>
  /** Tears the connection down without waiting for a final transcript. */
  cancel: () => void
  onPartialTranscript: (listener: (text: string) => void) => void
}

export function createLiveSttSession(): LiveSttSession {
  let pc: RTCPeerConnection | null = null
  let dc: RTCDataChannel | null = null
  let transcript = ''
  let awaitingFinalTranscript = false
  let resolveStop: ((text: string) => void) | null = null
  let partialListener: ((text: string) => void) | null = null

  function cleanup() {
    dc?.close()
    pc?.close()
    dc = null
    pc = null
  }

  function handleDataChannelMessage(event: MessageEvent<string>) {
    let parsed: { type?: string; delta?: string } | null = null
    try {
      parsed = JSON.parse(event.data)
    } catch {
      return
    }

    if (
      parsed?.type === 'conversation.item.input_audio_transcription.delta' &&
      typeof parsed.delta === 'string'
    ) {
      transcript += parsed.delta
      partialListener?.(transcript)
      return
    }

    if (
      parsed?.type ===
        'conversation.item.input_audio_transcription.completed' &&
      awaitingFinalTranscript
    ) {
      awaitingFinalTranscript = false
      resolveStop?.(transcript.trim())
      resolveStop = null
    }
  }

  async function start(
    mediaStream: MediaStream,
    clientSecret: string,
  ): Promise<void> {
    transcript = ''
    const connection = new RTCPeerConnection()
    pc = connection

    const track = mediaStream.getAudioTracks()[0]
    if (track) connection.addTrack(track, mediaStream)

    const channel = connection.createDataChannel(STT_DATA_CHANNEL_LABEL)
    channel.addEventListener('message', handleDataChannelMessage)
    dc = channel

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    await waitForIceGatheringComplete(connection)

    const response = await fetch(OPENAI_REALTIME_CALLS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: connection.localDescription?.sdp,
    })

    if (!response.ok) {
      cleanup()
      throw new Error('INTERVIEW_STT_CONNECT_FAILED')
    }

    const answerSdp = await response.text()
    await connection.setRemoteDescription({ type: 'answer', sdp: answerSdp })
  }

  function stop(): Promise<string> {
    return new Promise((resolve) => {
      if (!dc || dc.readyState !== 'open') {
        const finalText = transcript.trim()
        cleanup()
        resolve(finalText)
        return
      }

      resolveStop = (finalText) => {
        cleanup()
        resolve(finalText)
      }
      awaitingFinalTranscript = true
      dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))

      setTimeout(() => {
        if (!resolveStop) return
        const finalText = transcript.trim()
        awaitingFinalTranscript = false
        resolveStop = null
        cleanup()
        resolve(finalText)
      }, COMMIT_TIMEOUT_MS)
    })
  }

  function cancel() {
    resolveStop = null
    awaitingFinalTranscript = false
    cleanup()
  }

  function onPartialTranscript(listener: (text: string) => void) {
    partialListener = listener
  }

  return { start, stop, cancel, onPartialTranscript }
}
