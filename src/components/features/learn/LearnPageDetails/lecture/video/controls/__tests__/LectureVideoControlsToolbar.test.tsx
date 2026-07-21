// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'

import { LectureVideoControlsToolbar } from '../LectureVideoControlsToolbar'

const pushLearnEvent = vi.fn()
vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: (...args: Array<unknown>) => pushLearnEvent(...args),
}))

const toggleLectureVideoFullscreen = vi.fn()
vi.mock('../../hooks/lectureVideoFullscreen.utils', () => ({
  FULLSCREEN_CHANGE_EVENTS: ['fullscreenchange'],
  getFullscreenElement: () => null,
  toggleLectureVideoFullscreen: (...args: Array<unknown>) =>
    toggleLectureVideoFullscreen(...args),
}))

function ToolbarHarness({ onActivity }: { onActivity: () => void }) {
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef(null)

  return (
    <div ref={fullscreenContainerRef}>
      <LectureVideoControlsToolbar
        videoRef={videoRef}
        playerReadyVersion={0}
        totalDuration={120}
        displaySeconds={30}
        isPlaying={false}
        playbackRate={1}
        onPlaybackRateChange={vi.fn()}
        qualityLevels={[]}
        currentQuality={-1}
        onQualityChange={vi.fn()}
        fullscreenContainerRef={fullscreenContainerRef}
        onActivity={onActivity}
        transcriptAvailable={false}
        captionsOn={false}
        onCaptionsToggle={vi.fn()}
        chromeVisible={true}
      />
    </div>
  )
}

describe('LectureVideoControlsToolbar', () => {
  afterEach(() => {
    cleanup()
    pushLearnEvent.mockClear()
    toggleLectureVideoFullscreen.mockClear()
  })

  it('no longer renders an inline Ask pill (chat is a floating popup)', () => {
    render(<ToolbarHarness onActivity={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Open lecture AI assistant' }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
  })

  it('reports activity when play is pressed', () => {
    const onActivity = vi.fn()
    render(<ToolbarHarness onActivity={onActivity} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('toggles fullscreen and tracks the event', () => {
    render(<ToolbarHarness onActivity={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }))

    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_lecture_video_fullscreen_toggle',
    )
    expect(toggleLectureVideoFullscreen).toHaveBeenCalledTimes(1)
  })
})
