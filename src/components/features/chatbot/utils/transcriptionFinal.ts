import type { TextStreamData } from '@livekit/components-core'

const TRANSCRIPTION_FINAL_ATTR = 'lk.transcription_final'

export function isTranscriptionFinal(stream: TextStreamData): boolean {
  const value = stream.streamInfo.attributes?.[TRANSCRIPTION_FINAL_ATTR]
  return value === 'true' || value === '1'
}

export function buildFinalByStreamId(transcriptions: TextStreamData[]): Map<string, boolean> {
  const result = new Map<string, boolean>()
  for (const stream of transcriptions) {
    result.set(stream.streamInfo.id, isTranscriptionFinal(stream))
  }
  return result
}

