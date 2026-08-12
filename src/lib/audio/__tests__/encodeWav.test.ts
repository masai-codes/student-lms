import { describe, expect, it } from 'vitest'
import {
  buildWavHeader,
  downmixToMono,
  encodePcmToWavBlob,
  floatTo16BitPcm,
  resampleLinear,
  WAV_BITS_PER_SAMPLE,
  WAV_CHANNELS,
  WAV_SAMPLE_RATE,
} from '../encodeWav'

function readAscii(view: DataView, offset: number, length: number): string {
  let out = ''
  for (let i = 0; i < length; i++)
    out += String.fromCharCode(view.getUint8(offset + i))
  return out
}

describe('buildWavHeader', () => {
  it('produces a valid RIFF/WAVE header with the expected sample rate and channels', () => {
    const view = buildWavHeader(1000)
    expect(readAscii(view, 0, 4)).toBe('RIFF')
    expect(readAscii(view, 8, 4)).toBe('WAVE')
    expect(readAscii(view, 12, 4)).toBe('fmt ')
    expect(readAscii(view, 36, 4)).toBe('data')
    expect(view.getUint16(20, true)).toBe(1) // PCM
    expect(view.getUint16(22, true)).toBe(WAV_CHANNELS)
    expect(view.getUint32(24, true)).toBe(WAV_SAMPLE_RATE)
    expect(view.getUint16(34, true)).toBe(WAV_BITS_PER_SAMPLE)
    expect(view.getUint32(40, true)).toBe(1000)
    expect(view.getUint32(4, true)).toBe(36 + 1000)
  })
})

describe('downmixToMono', () => {
  it('returns the single channel unchanged for mono input', () => {
    const data = new Float32Array([0.1, 0.2, 0.3])
    const buffer = {
      numberOfChannels: 1,
      length: data.length,
      getChannelData: () => data,
    } as unknown as AudioBuffer

    expect(downmixToMono(buffer)).toBe(data)
  })

  it('averages channels for stereo input', () => {
    const left = new Float32Array([1, 1])
    const right = new Float32Array([-1, 0])
    const buffer = {
      numberOfChannels: 2,
      length: 2,
      getChannelData: (i: number) => (i === 0 ? left : right),
    } as unknown as AudioBuffer

    expect(Array.from(downmixToMono(buffer))).toEqual([0, 0.5])
  })
})

describe('resampleLinear', () => {
  it('returns the input unchanged when rates match', () => {
    const input = new Float32Array([1, 2, 3])
    expect(resampleLinear(input, 16000, 16000)).toBe(input)
  })

  it('downsamples to half the length for half the rate', () => {
    const input = new Float32Array([0, 1, 2, 3])
    const output = resampleLinear(input, 32000, 16000)
    expect(output.length).toBe(2)
  })
})

describe('floatTo16BitPcm', () => {
  it('converts float samples to clamped 16-bit PCM', () => {
    const input = new Float32Array([0, 1, -1, 2, -2])
    const view = floatTo16BitPcm(input)
    expect(view.getInt16(0, true)).toBe(0)
    expect(view.getInt16(2, true)).toBe(0x7fff)
    expect(view.getInt16(4, true)).toBe(-0x8000)
    expect(view.getInt16(6, true)).toBe(0x7fff) // clamped
    expect(view.getInt16(8, true)).toBe(-0x8000) // clamped
  })
})

describe('encodePcmToWavBlob', () => {
  it('produces a wav blob sized for the header plus PCM data', () => {
    const samples = new Float32Array([0, 0.5, -0.5])
    const blob = encodePcmToWavBlob(samples)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + samples.length * 2)
  })
})
