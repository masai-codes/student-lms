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
    state: 'idle' as 'idle' | 'recording' | 'recorded',
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
  liveSttState: {
    partialTranscript: '',
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => 'A hash map maps keys to values.'),
    cancel: vi.fn(),
  },
}))

vi.mock('@/hooks/useInterviewRecorder', () => ({
  useInterviewRecorder: () => hoisted.recorderState,
}))

vi.mock('@/hooks/useLiveInterviewStt', () => ({
  useLiveInterviewStt: () => hoisted.liveSttState,
}))

vi.mock('./LiveWaveform', () => ({
  LiveWaveform: () => <div data-testid="live-waveform" />,
}))

beforeEach(() => {
  hoisted.recorderState.state = 'idle'
  hoisted.recorderState.mediaStream = null
  hoisted.recorderState.permissionDenied = false
  hoisted.recorderState.startRecording = vi.fn(async () => true)
  hoisted.recorderState.stopAndSubmit = vi.fn(async () => null)
  hoisted.recorderState.stopAndDiscard = vi.fn()
  hoisted.liveSttState.start = vi.fn(async () => {})
  hoisted.liveSttState.stop = vi.fn(
    async () => 'A hash map maps keys to values.',
  )
  hoisted.liveSttState.cancel = vi.fn()
})

afterEach(cleanup)

describe('AnswerRecorder', () => {
  it('shows the live waveform while recording with an active mic stream', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    // Let the STT "connecting" phase (started in an effect on mount) settle
    // before asserting on the ready-to-record UI.
    await act(async () => {})
    expect(screen.getByTestId('live-waveform')).toBeTruthy()
  })

  it('shows a connecting state until the live STT session finishes starting', async () => {
    let resolveSttStart: () => void = () => {}
    hoisted.liveSttState.start = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSttStart = resolve
        }),
    )
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    await act(async () => {})

    expect(screen.getByLabelText('Connecting')).toBeTruthy()
    expect(screen.queryByTestId('live-waveform')).toBeNull()

    await act(async () => {
      resolveSttStart()
    })

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

  it('falls back to typed mode when live STT fails to start', async () => {
    hoisted.liveSttState.start = vi.fn(async () => {
      throw new Error('stt unavailable')
    })

    const { rerender } = render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    await act(async () => {
      rerender(
        <AnswerRecorder
          sessionId={1}
          isSubmitting={false}
          onSubmit={vi.fn()}
        />,
      )
    })

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Type your answer…')).toBeTruthy(),
    )
    expect(hoisted.recorderState.stopAndDiscard).toHaveBeenCalled()
  })

  it('calls stopAndDiscard and cancels STT when the cross button is clicked while recording', () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByLabelText('Discard recording'))
    expect(hoisted.recorderState.stopAndDiscard).toHaveBeenCalledTimes(1)
    expect(hoisted.liveSttState.cancel).toHaveBeenCalledTimes(1)
  })

  it('submits the transcript accumulated so far immediately, tearing STT/recorder down in the background', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    hoisted.liveSttState.partialTranscript = 'A hash map maps keys to values.'
    const onSubmit = vi.fn(async () => {})
    const callOrder: Array<string> = []
    hoisted.liveSttState.stop = vi.fn(async () => {
      callOrder.push('stt-stop')
      return 'A hash map maps keys to values.'
    })
    hoisted.recorderState.stopAndSubmit = vi.fn(async () => {
      callOrder.push('recorder-stop')
      return new Blob(['x'])
    })

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {})
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(callOrder).toEqual(['stt-stop', 'recorder-stop'])
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'transcribed',
      text: 'A hash map maps keys to values.',
    })
  })

  it('does not submit when no transcript has accumulated yet', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    hoisted.liveSttState.partialTranscript = ''
    const onSubmit = vi.fn(async () => {})

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {})
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('enters the sending state immediately on click, before onSubmit resolves', async () => {
    hoisted.recorderState.state = 'recording'
    hoisted.recorderState.mediaStream = {} as MediaStream
    hoisted.liveSttState.partialTranscript = 'done'
    let resolveOnSubmit: () => void = () => {}
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnSubmit = resolve
        }),
    )

    render(
      <AnswerRecorder sessionId={1} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {})

    fireEvent.click(screen.getByTestId('interview-submit-answer'))

    // Still awaiting onSubmit — the button must already reflect the sending
    // state rather than looking untouched/clickable.
    await waitFor(() =>
      expect(screen.getByLabelText('Submitting')).toBeTruthy(),
    )

    await act(async () => {
      resolveOnSubmit()
    })
  })
})
