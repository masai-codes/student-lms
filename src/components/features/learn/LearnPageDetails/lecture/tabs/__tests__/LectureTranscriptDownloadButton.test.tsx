// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureTranscriptDownloadButton } from '../LectureTranscriptDownloadButton'
import { downloadTextFile } from '@/lib/downloadTextFile'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

vi.mock('@/lib/downloadTextFile', () => ({
  downloadTextFile: vi.fn(),
}))

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: vi.fn(),
  learnEntityEvent: (type: string, action: string, id: number) =>
    `l_learn_${type}_${action}_id_${id}`,
}))

const SEGMENTS = [
  { id: 1, start: 0, end: 4, text: 'Hello there' },
  { id: 2, start: 65, end: 70, text: 'Welcome to class' },
]

describe('LectureTranscriptDownloadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('downloads the timestamped segments under a lecture-scoped file name', () => {
    render(
      <LectureTranscriptDownloadButton
        segments={SEGMENTS}
        text={null}
        lectureId={7}
      />,
    )

    fireEvent.click(screen.getByTestId('lecture-transcript-download-button'))

    expect(downloadTextFile).toHaveBeenCalledWith(
      'lecture-7-transcript.txt',
      '[0:00] Hello there\n[1:05] Welcome to class',
    )
  })

  it('downloads the plain-text fallback when there are no segments', () => {
    render(
      <LectureTranscriptDownloadButton
        segments={[]}
        text="A flat transcript"
        lectureId={9}
      />,
    )

    fireEvent.click(screen.getByTestId('lecture-transcript-download-button'))

    expect(downloadTextFile).toHaveBeenCalledWith(
      'lecture-9-transcript.txt',
      'A flat transcript',
    )
  })

  it('fires an entity-scoped GTM event before downloading', () => {
    render(
      <LectureTranscriptDownloadButton
        segments={SEGMENTS}
        text={null}
        lectureId={7}
      />,
    )

    fireEvent.click(screen.getByTestId('lecture-transcript-download-button'))

    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_lecture_transcript_download_id_7',
      { tab: 'transcript', lectureId: 7, segmentCount: 2, format: 'txt' },
    )
  })

  it('falls back to an id-less event and file name when the id is unknown', () => {
    render(
      <LectureTranscriptDownloadButton
        segments={SEGMENTS}
        text={null}
        lectureId={null}
      />,
    )

    fireEvent.click(screen.getByTestId('lecture-transcript-download-button'))

    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_lecture_transcript_download',
      { tab: 'transcript', lectureId: null, segmentCount: 2, format: 'txt' },
    )
    expect(downloadTextFile).toHaveBeenCalledWith(
      'lecture-transcript.txt',
      expect.any(String),
    )
  })

  it('renders nothing when there is no transcript content', () => {
    render(
      <LectureTranscriptDownloadButton
        segments={[]}
        text={null}
        lectureId={7}
      />,
    )

    expect(
      screen.queryByTestId('lecture-transcript-download-button'),
    ).toBeNull()
  })
})
