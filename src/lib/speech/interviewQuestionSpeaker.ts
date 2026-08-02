/** Matches a sentence boundary: `.`/`!`/`?` followed by whitespace or end-of-buffer. */
const SENTENCE_BOUNDARY = /([.!?])(\s+|$)/

/**
 * Speaks the interviewer's next question aloud, sentence by sentence, as text
 * deltas stream in from the model — using the browser's built-in
 * `speechSynthesis` (no server-side TTS provider, no added cost/dependency).
 * Buffers incomplete sentences until a boundary appears so utterances read
 * naturally instead of one word at a time; `finish()` flushes any trailing
 * fragment once the stream ends. No-ops silently where `speechSynthesis`
 * isn't available (SSR, unsupported browsers, tests) rather than throwing.
 */
export function createInterviewQuestionSpeaker() {
  const synth =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined
  let buffer = ''

  function speak(sentence: string) {
    const text = sentence.trim()
    if (!text || !synth) return
    synth.speak(new SpeechSynthesisUtterance(text))
  }

  function pushText(delta: string) {
    buffer += delta
    let match = buffer.match(SENTENCE_BOUNDARY)
    while (match && match.index !== undefined) {
      const endIndex = match.index + match[0].length
      speak(buffer.slice(0, endIndex))
      buffer = buffer.slice(endIndex)
      match = buffer.match(SENTENCE_BOUNDARY)
    }
  }

  function finish() {
    speak(buffer)
    buffer = ''
  }

  function cancel() {
    buffer = ''
    synth?.cancel()
  }

  return { pushText, finish, cancel }
}
