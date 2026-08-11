// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInterviewAudioPlayer } from '../interviewAudioPlayer'

class FakeAudioBufferSourceNode {
  buffer: unknown = null
  connectedTo: unknown = null
  started = false
  startTime: number | undefined
  stopped = false
  onended: (() => void) | null = null

  connect(destination: unknown) {
    this.connectedTo = destination
  }

  start(time: number) {
    this.started = true
    this.startTime = time
  }

  stop() {
    this.stopped = true
    this.onended?.()
  }
}

class FakeAudioContext {
  currentTime = 0
  destination = {}
  sources: Array<FakeAudioBufferSourceNode> = []
  buffers: Array<{ duration: number; getChannelData: () => Float32Array }> = []

  createBuffer(_channels: number, length: number, sampleRate: number) {
    const channelData = new Float32Array(length)
    const buffer = {
      duration: length / sampleRate,
      getChannelData: () => channelData,
    }
    this.buffers.push(buffer)
    return buffer
  }

  createBufferSource() {
    const source = new FakeAudioBufferSourceNode()
    this.sources.push(source)
    return source
  }
}

/** Base64 for 4 little-endian Int16 samples: 0, 16384, -16384, 32767. */
const FOUR_SAMPLE_CHUNK_BASE64 = Buffer.from(
  new Int16Array([0, 16384, -16384, 32767]).buffer,
).toString('base64')

describe('createInterviewAudioPlayer', () => {
  let fakeContext: FakeAudioContext

  beforeEach(() => {
    fakeContext = new FakeAudioContext()
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => fakeContext),
    )
  })

  it('decodes and schedules a PCM16 chunk on the AudioContext', () => {
    const player = createInterviewAudioPlayer()
    player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)

    expect(fakeContext.buffers).toHaveLength(1)
    const channel = fakeContext.buffers[0].getChannelData()
    expect(channel).toHaveLength(4)
    expect(channel[0]).toBeCloseTo(0)
    expect(channel[1]).toBeCloseTo(0.5, 2)
    expect(channel[3]).toBeCloseTo(1, 2)

    expect(fakeContext.sources).toHaveLength(1)
    expect(fakeContext.sources[0].started).toBe(true)
    expect(fakeContext.sources[0].connectedTo).toBe(fakeContext.destination)
  })

  it('schedules consecutive chunks back-to-back for gapless playback', () => {
    const player = createInterviewAudioPlayer()
    player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)
    player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)

    const [first, second] = fakeContext.sources
    expect(second.startTime).toBeGreaterThanOrEqual(
      (first.startTime ?? 0) + fakeContext.buffers[0].duration,
    )
  })

  it('stops all scheduled sources on cancel', () => {
    const player = createInterviewAudioPlayer()
    player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)
    player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)

    player.cancel()

    expect(fakeContext.sources.every((s) => s.stopped)).toBe(true)
  })

  it('ignores empty chunks', () => {
    const player = createInterviewAudioPlayer()
    player.pushChunk('')
    expect(fakeContext.sources).toHaveLength(0)
  })

  it('no-ops without throwing when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined)
    const player = createInterviewAudioPlayer()
    expect(() => {
      player.pushChunk(FOUR_SAMPLE_CHUNK_BASE64)
      player.finish()
      player.cancel()
    }).not.toThrow()
  })
})
