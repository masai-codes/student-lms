// @vitest-environment jsdom
// `USE_LIVE_STT` is evaluated once at import time from
// `VITE_INTERVIEW_STT_PROVIDER`, so `AnswerRecorder` must be re-imported
// *after* stubbing the env — see resolveApiFetchUrl.test.ts for the same
// pattern.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  recorderState: {
    state: 'recording' as 'idle' | 'recording' | 'recorded',
    seconds: 0,
    audioBlob: null as Blob | null,
    mediaStream: {} as MediaStream | null,
    permissionDenied: false,
    isPlaying: false,
    waveformRef: { current: null },
    startRecording: vi.fn(async () => true),
    stopRecording: vi.fn(),
    discardRecording: vi.fn(),
    togglePlayback: vi.fn(),
    stopAndSubmit: vi.fn(async () => new Blob(['x'])),
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

vi.mock('@/lib/audio/encodeWav', () => ({
  encodeWavFromBlob: vi.fn(async (blob: Blob) => blob),
}))

async function loadAnswerRecorder() {
  vi.resetModules()
  vi.stubEnv('VITE_INTERVIEW_STT_PROVIDER', 'openai-transcribe')
  return (await import('./AnswerRecorder')).AnswerRecorder
}

beforeEach(() => {
  hoisted.recorderState.state = 'recording'
  hoisted.recorderState.mediaStream = {} as MediaStream
  hoisted.recorderState.stopAndSubmit = vi.fn(async () => new Blob(['x']))
  hoisted.recorderState.stopAndDiscard = vi.fn()
  hoisted.liveSttState.start = vi.fn(async () => {})
  hoisted.liveSttState.stop = vi.fn(
    async () => 'A hash map maps keys to values.',
  )
  hoisted.liveSttState.cancel = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

describe('AnswerRecorder with VITE_INTERVIEW_STT_PROVIDER=openai-transcribe', () => {
  it('starts the live STT session once a mic stream is available while recording', async () => {
    const AnswerRecorder = await loadAnswerRecorder()

    await act(async () => {
      render(
        <AnswerRecorder
          sessionId={7}
          isSubmitting={false}
          onSubmit={vi.fn()}
        />,
      )
    })

    expect(hoisted.liveSttState.start).toHaveBeenCalledWith(
      hoisted.recorderState.mediaStream,
    )
  })

  it('stops the STT session before releasing the mic, then submits the transcript', async () => {
    const AnswerRecorder = await loadAnswerRecorder()
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
      <AnswerRecorder sessionId={7} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(callOrder).toEqual(['stt-stop', 'recorder-stop'])
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'transcribed',
      text: 'A hash map maps keys to values.',
    })
  })

  it('does not submit when the STT session produced an empty transcript', async () => {
    const AnswerRecorder = await loadAnswerRecorder()
    const onSubmit = vi.fn(async () => {})
    hoisted.liveSttState.stop = vi.fn(async () => '')

    render(
      <AnswerRecorder sessionId={7} isSubmitting={false} onSubmit={onSubmit} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId('interview-submit-answer'))
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cancels the STT session when the recording is discarded', async () => {
    const AnswerRecorder = await loadAnswerRecorder()

    render(
      <AnswerRecorder sessionId={7} isSubmitting={false} onSubmit={vi.fn()} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Discard recording'))
    })

    expect(hoisted.liveSttState.cancel).toHaveBeenCalledTimes(1)
    expect(hoisted.recorderState.stopAndDiscard).toHaveBeenCalledTimes(1)
  })
})
