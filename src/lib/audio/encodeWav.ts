/**
 * Re-encodes a `MediaRecorder` blob (webm/opus on Chrome, mp4/aac on Safari)
 * into 16kHz mono PCM16 WAV — the container/rate OpenRouter's audio-input
 * models actually accept. `webm`/`mp4` are not on that list, so this has to
 * happen client-side before upload.
 */

export const WAV_SAMPLE_RATE = 16_000
export const WAV_CHANNELS = 1
export const WAV_BITS_PER_SAMPLE = 16

export function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0)

  const out = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i++)
      out[i] += data[i] / buffer.numberOfChannels
  }
  return out
}

export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return input

  const ratio = fromRate / toRate
  const outLength = Math.round(input.length / ratio)
  const output = new Float32Array(outLength)

  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio
    const lower = Math.floor(srcIndex)
    const upper = Math.min(lower + 1, input.length - 1)
    const weight = srcIndex - lower
    output[i] = input[lower] * (1 - weight) + input[upper] * weight
  }

  return output
}

export function floatTo16BitPcm(input: Float32Array): DataView {
  const view = new DataView(new ArrayBuffer(input.length * 2))
  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(
      i * 2,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    )
  }
  return view
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

/** Builds a canonical 44-byte PCM WAV header for `dataLength` bytes of PCM16 data. */
export function buildWavHeader(dataLength: number): DataView {
  const view = new DataView(new ArrayBuffer(44))
  const byteRate = (WAV_SAMPLE_RATE * WAV_CHANNELS * WAV_BITS_PER_SAMPLE) / 8
  const blockAlign = (WAV_CHANNELS * WAV_BITS_PER_SAMPLE) / 8

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, WAV_CHANNELS, true)
  view.setUint32(24, WAV_SAMPLE_RATE, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, WAV_BITS_PER_SAMPLE, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  return view
}

export function encodePcmToWavBlob(mono16kHz: Float32Array): Blob {
  const pcm = floatTo16BitPcm(mono16kHz)
  const header = buildWavHeader(pcm.byteLength)
  return new Blob([header.buffer as ArrayBuffer, pcm.buffer as ArrayBuffer], {
    type: 'audio/wav',
  })
}

async function encodeWavFromBlob(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  const audioContext = new AudioContextCtor()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const mono = downmixToMono(audioBuffer)
    const resampled = resampleLinear(
      mono,
      audioBuffer.sampleRate,
      WAV_SAMPLE_RATE,
    )
    return encodePcmToWavBlob(resampled)
  } finally {
    void audioContext.close()
  }
}
