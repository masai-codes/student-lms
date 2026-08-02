// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnswerRecorder } from './AnswerRecorder'

const hoisted = vi.hoisted(() => ({
  recorderState: {
    state: 'idle',
    seconds: 0,
    audioBlob: null as Blob | null,
    mediaStream: null as MediaStream | null,
    permissionDenied: false,
    isPlaying: false,
    waveformRef: { current: null },
    startRecording: vi.fn(async () => true),
    stopRecording: vi.fn(),
    discardRecording: vi.fn(),
    togglePlayback: vi.fn(),
    stopAndSubmit: vi.fn(async () => null as Blob | null),
    stopAndDiscard: vi.fn(),
  },
}))

vi.mock('@/hooks/useInterviewRecorder', () => ({
  useInterviewRecorder: () => hoisted.recorderState,
}))

vi.mock('./LiveWaveform', () => ({
  LiveWaveform: () => <div data-testid="live-waveform" />,
}))

vi.mock('@/lib/audio/encodeWav', () => ({
  encodeWavFromBlob: vi.fn(async (blob: Blob) => blob),
}))

beforeEach(() => {
  hoisted.recorderState.state = 'idle'
  hoisted.recorderState.mediaStream = null
  hoisted.recorderState.permissionDenied = false
  hoisted.recorderState.startRecording = vi.fn(async () => true)
  hoisted.recorderState.stopAndSubmit = vi.fn(async () => null)
  hoisted.recorderState.stopAndDiscard = vi.fn()
})

afterEach(cleanup)

describe('AnswerRecorder', () => {
  it('shows the live waveform while recording with an active mic stream', () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream

    render(<AnswerRecorder isSubmitting={false} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('live-waveform')).toBeTruthy()
  })

  it('does not show the live waveform when idle', () => {
    render(<AnswerRecorder isSubmitting={false} onSubmit={vi.fn()} />)
    expect(screen.queryByTestId('live-waveform')).toBeNull()
  })

  it('falls back to typed mode when startRecording resolves false (permission denied)', async () => {
    hoisted.recorderState.startRecording = vi.fn(async () => false)

    render(<AnswerRecorder isSubmitting={false} onSubmit={vi.fn()} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-record-button'))
    })
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type your answer…')).toBeTruthy(),
    )
  })

  it('calls stopAndDiscard when the cross button is clicked while recording', () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream

    render(<AnswerRecorder isSubmitting={false} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Discard recording'))
    expect(hoisted.recorderState.stopAndDiscard).toHaveBeenCalledTimes(1)
  })

  it('calls stopAndSubmit and onSubmit when the send button is clicked while recording', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    const blob = new Blob(['x'])
    hoisted.recorderState.stopAndSubmit = vi.fn(async () => blob)
    const onSubmit = vi.fn(async () => {})

    render(<AnswerRecorder isSubmitting={false} onSubmit={onSubmit} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(hoisted.recorderState.stopAndSubmit).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ kind: 'audio', blob }),
    )
  })
})
