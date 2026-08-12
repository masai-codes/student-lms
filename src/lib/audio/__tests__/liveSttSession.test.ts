// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLiveSttSession } from '../liveSttSession'

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'open'
  sent: Array<string> = []
  closed = false

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
    this.readyState = 'closed'
  }

  emitMessage(data: unknown) {
    this.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(data) }),
    )
  }
}

class FakePeerConnection {
  iceGatheringState: RTCIceGatheringState = 'complete'
  localDescription: { sdp: string } | null = null
  closed = false
  tracks: Array<MediaStreamTrack> = []
  dataChannel: FakeDataChannel | null = null

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track)
  }

  createDataChannel(_label: string) {
    this.dataChannel = new FakeDataChannel()
    return this.dataChannel
  }

  async createOffer() {
    return { type: 'offer', sdp: 'fake-offer-sdp' }
  }

  async setLocalDescription(desc: { sdp: string }) {
    this.localDescription = desc
  }

  async setRemoteDescription() {}

  addEventListener() {}
  removeEventListener() {}

  close() {
    this.closed = true
  }
}

function fakeMediaStream(): MediaStream {
  return {
    getAudioTracks: () => [{} as MediaStreamTrack],
  } as unknown as MediaStream
}

describe('createLiveSttSession', () => {
  let peerConnection: FakePeerConnection

  beforeEach(() => {
    peerConnection = new FakePeerConnection()
    vi.stubGlobal(
      'RTCPeerConnection',
      vi.fn(() => peerConnection),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'fake-answer-sdp',
      })),
    )
  })

  it('posts the SDP offer to OpenAI with the client secret and sets the remote answer', async () => {
    const session = createLiveSttSession()
    await session.start(fakeMediaStream(), 'ek_test')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/calls',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer ek_test' }),
        body: 'fake-offer-sdp',
      }),
    )
  })

  it('accumulates transcript deltas and resolves stop() once completed fires after commit', async () => {
    const session = createLiveSttSession()
    const partials: Array<string> = []
    session.onPartialTranscript((text) => partials.push(text))
    await session.start(fakeMediaStream(), 'ek_test')

    const dc = peerConnection.dataChannel!
    dc.emitMessage({
      type: 'conversation.item.input_audio_transcription.delta',
      delta: 'Hello ',
    })
    dc.emitMessage({
      type: 'conversation.item.input_audio_transcription.delta',
      delta: 'world',
    })

    const stopPromise = session.stop()
    expect(dc.sent).toEqual([
      JSON.stringify({ type: 'input_audio_buffer.commit' }),
    ])

    dc.emitMessage({
      type: 'conversation.item.input_audio_transcription.completed',
    })

    await expect(stopPromise).resolves.toBe('Hello world')
    expect(partials).toEqual(['Hello ', 'Hello world'])
    expect(dc.closed).toBe(true)
    expect(peerConnection.closed).toBe(true)
  })

  it('resolves stop() with whatever was accumulated if the data channel is not open', async () => {
    const session = createLiveSttSession()
    await session.start(fakeMediaStream(), 'ek_test')
    peerConnection.dataChannel!.readyState = 'closed'

    await expect(session.stop()).resolves.toBe('')
  })

  it('throws and cleans up when the SDP exchange fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, text: async () => '' })),
    )
    const session = createLiveSttSession()

    await expect(session.start(fakeMediaStream(), 'ek_test')).rejects.toThrow(
      'INTERVIEW_STT_CONNECT_FAILED',
    )
    expect(peerConnection.closed).toBe(true)
  })
})
