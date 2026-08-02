// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInterviewRecorder } from '../useInterviewRecorder'

vi.mock('wavesurfer.js', () => ({
  default: {
    create: () => ({
      load: vi.fn(),
      on: vi.fn(),
      playPause: vi.fn(),
      destroy: vi.fn(),
    }),
  },
}))

class FakeMediaRecorder {
  static instances: Array<FakeMediaRecorder> = []
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  mimeType = 'audio/webm'
  state: 'inactive' | 'recording' = 'inactive'

  constructor(public stream: MediaStream) {
    FakeMediaRecorder.instances.push(this)
  }

  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['x']) })
    this.onstop?.()
  }
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
}

beforeEach(() => {
  FakeMediaRecorder.instances = []
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn(async () => fakeStream()) },
  })
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useInterviewRecorder', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useInterviewRecorder())
    expect(result.current.state).toBe('idle')
  })

  it('transitions to recording, then recorded on stop', async () => {
    const { result } = renderHook(() => useInterviewRecorder())

    await act(async () => {
      await result.current.startRecording()
    })
    expect(result.current.state).toBe('recording')
    expect(result.current.mediaStream).not.toBeNull()

    act(() => {
      result.current.stopRecording()
    })
    await waitFor(() => expect(result.current.state).toBe('recorded'))
    expect(result.current.audioBlob).not.toBeNull()
    expect(result.current.mediaStream).toBeNull()
  })

  it('sets permissionDenied when getUserMedia rejects', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          throw new Error('denied')
        }),
      },
    })
    const { result } = renderHook(() => useInterviewRecorder())

    let started: boolean | undefined
    await act(async () => {
      started = await result.current.startRecording()
    })
    expect(started).toBe(false)
    expect(result.current.permissionDenied).toBe(true)
    expect(result.current.state).toBe('idle')
  })

  it('startRecording resolves true once recording begins', async () => {
    const { result } = renderHook(() => useInterviewRecorder())

    let started: boolean | undefined
    await act(async () => {
      started = await result.current.startRecording()
    })
    expect(started).toBe(true)
    expect(result.current.state).toBe('recording')
  })

  it('discardRecording resets back to idle', async () => {
    const { result } = renderHook(() => useInterviewRecorder())
    await act(async () => {
      await result.current.startRecording()
    })
    act(() => result.current.stopRecording())
    await waitFor(() => expect(result.current.state).toBe('recorded'))

    act(() => result.current.discardRecording())
    expect(result.current.state).toBe('idle')
    expect(result.current.audioBlob).toBeNull()
  })

  it('stopAndDiscard goes straight to idle, skipping the recorded preview state', async () => {
    const { result } = renderHook(() => useInterviewRecorder())
    await act(async () => {
      await result.current.startRecording()
    })

    act(() => result.current.stopAndDiscard())
    await waitFor(() => expect(result.current.state).toBe('idle'))
    expect(result.current.audioBlob).toBeNull()
  })

  it('stopAndSubmit resolves with the final blob and returns straight to idle', async () => {
    const { result } = renderHook(() => useInterviewRecorder())
    await act(async () => {
      await result.current.startRecording()
    })

    let blob: Blob | null = null
    await act(async () => {
      blob = await result.current.stopAndSubmit()
    })
    expect(blob).not.toBeNull()
    expect(result.current.state).toBe('idle')
    expect(result.current.audioBlob).toBeNull()
  })

  it('stopAndSubmit resolves null when not currently recording', async () => {
    const { result } = renderHook(() => useInterviewRecorder())

    const blob = await result.current.stopAndSubmit()
    expect(blob).toBeNull()
  })
})
