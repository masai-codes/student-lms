/**
 * Streams and plays the interviewer's spoken response as it arrives — 24kHz
 * mono PCM16 chunks (OpenAI's audio-output format) come in as base64 strings
 * over SSE; each is decoded and scheduled back-to-back on a single
 * `AudioContext` so playback is gapless without waiting for the full
 * response. No-ops silently where `AudioContext` isn't available (SSR,
 * unsupported browsers, tests) rather than throwing.
 */

const SAMPLE_RATE = 24_000

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

export function createInterviewAudioPlayer() {
  const context =
    typeof window !== 'undefined' && window.AudioContext
      ? new window.AudioContext()
      : undefined

  let nextStartTime = 0
  let sources: Array<AudioBufferSourceNode> = []

  function pushChunk(base64: string) {
    if (!context || !base64) return

    const pcm16 = base64ToInt16Array(base64)
    if (pcm16.length === 0) return

    const buffer = context.createBuffer(1, pcm16.length, SAMPLE_RATE)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < pcm16.length; i++) channel[i] = pcm16[i] / 0x8000

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)

    const startTime = Math.max(nextStartTime, context.currentTime)
    source.start(startTime)
    nextStartTime = startTime + buffer.duration

    sources.push(source)
    source.onended = () => {
      sources = sources.filter((s) => s !== source)
    }
  }

  function finish() {
    // No-op: chunks already scheduled keep playing to completion on their own.
  }

  function cancel() {
    for (const source of sources) {
      try {
        source.stop()
      } catch {
        // Already stopped/ended — nothing to do.
      }
    }
    sources = []
    nextStartTime = context?.currentTime ?? 0
  }

  return { pushChunk, finish, cancel }
}
