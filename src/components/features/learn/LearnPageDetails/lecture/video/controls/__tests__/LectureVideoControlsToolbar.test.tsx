// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'

import { LectureSplitChatProvider } from '../../../hooks/LectureSplitChatContext'
import { LectureVideoControlsToolbar } from '../LectureVideoControlsToolbar'

function ToolbarHarness({
  splitChat,
}: {
  splitChat: { isOpen: boolean; open: () => void; close: () => void }
}) {
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef(null)

  return (
    <LectureSplitChatProvider value={splitChat}>
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
          onActivity={vi.fn()}
          transcriptAvailable={false}
          captionsOn={false}
          onCaptionsToggle={vi.fn()}
          chromeVisible={true}
        />
      </div>
    </LectureSplitChatProvider>
  )
}

describe('LectureVideoControlsToolbar Ask pill', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the Ask pill when chat is collapsed', () => {
    const open = vi.fn()

    render(
      <ToolbarHarness splitChat={{ isOpen: false, open, close: vi.fn() }} />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Open lecture AI assistant' }),
    )

    expect(open).toHaveBeenCalledTimes(1)
  })

  it('hides the Ask pill when chat is already open', () => {
    render(
      <ToolbarHarness
        splitChat={{ isOpen: true, open: vi.fn(), close: vi.fn() }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Open lecture AI assistant' }),
    ).toBeNull()
  })
})
