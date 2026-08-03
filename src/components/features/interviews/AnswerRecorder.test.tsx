// @vitest-environment jsdom
// `USE_LIVE_STT` is evaluated once at import time from
// `VITE_INTERVIEW_STT_PROVIDER` — force it unset here so this suite (the
// default flow) is deterministic regardless of the developer's local
// `.env.local` (Vitest, like Vite, loads it automatically). See
// AnswerRecorder.liveStt.test.tsx for the flag-enabled behavior.
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { AnswerRecorder as AnswerRecorderComponent } from './AnswerRecorder'

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

let AnswerRecorder: typeof AnswerRecorderComponent

beforeAll(async () => {
  vi.resetModules()
  vi.stubEnv('VITE_INTERVIEW_STT_PROVIDER', '')
  ;({ AnswerRecorder } = await import('./AnswerRecorder'))
})

afterAll(() => {
  vi.unstubAllEnvs()
})

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

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    expect(screen.getByTestId('live-waveform')).toBeTruthy()
  })

  it('does not show the live waveform when idle', () => {
    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    expect(screen.queryByTestId('live-waveform')).toBeNull()
  })

  it('falls back to typed mode when startRecording resolves false (permission denied)', async () => {
    hoisted.recorderState.startRecording = vi.fn(async () => false)

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
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

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByLabelText('Discard recording'))
    expect(hoisted.recorderState.stopAndDiscard).toHaveBeenCalledTimes(1)
  })

  it('calls stopAndSubmit and onSubmit when the send button is clicked while recording', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    const blob = new Blob(['x'])
    hoisted.recorderState.stopAndSubmit = vi.fn(async () => blob)
    const onSubmit = vi.fn(async () => {})

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(hoisted.recorderState.stopAndSubmit).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ kind: 'audio', blob }),
    )
  })

  it('enters the sending state immediately on click, before stopAndSubmit resolves', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    let resolveStopAndSubmit: (blob: Blob | null) => void = () => {}
    hoisted.recorderState.stopAndSubmit = vi.fn(
      () =>
        new Promise<Blob | null>((resolve) => {
          resolveStopAndSubmit = resolve
        }),
    )
    const onSubmit = vi.fn(async () => {})

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={onSubmit} />,
    )

    fireEvent.click(screen.getByTestId('interview-submit-answer'))

    // Still awaiting stopAndSubmit — the button must already reflect the
    // sending state rather than looking untouched/clickable.
    expect(screen.getByLabelText('Submitting')).toBeTruthy()
    expect(screen.queryByLabelText('Send recording')).toBeNull()

    await act(async () => {
      resolveStopAndSubmit(new Blob(['x']))
    })
  })
})
