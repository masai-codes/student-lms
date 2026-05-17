'use client'

import ReactPlayer from 'react-player/lazy'

import { LectureTheaterModeToggle } from './LectureTheaterModeToggle'

import './lectureReactPlayer.css'

import { cn } from '@/lib/utils'

type LectureReactPlayerProps = {
  src: string
  className?: string
  isTheaterMode?: boolean
  onTheaterModeToggle?: () => void
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function LectureReactPlayer({
  src,
  className,
  isTheaterMode = false,
  onTheaterModeToggle,
}: LectureReactPlayerProps) {
  return (
    <div
      className={cn(
        'lecture-react-player relative flex h-full min-h-0 w-full flex-1 flex-col bg-black',
        className,
      )}
    >
      {onTheaterModeToggle ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-2">
          <LectureTheaterModeToggle
            isTheaterMode={isTheaterMode}
            onToggle={onTheaterModeToggle}
            className="pointer-events-auto"
          />
        </div>
      ) : null}
      <div className="lecture-react-player__stage">
        <ReactPlayer
          className="lecture-react-player__rp"
          url={src}
          width="100%"
          height="100%"
          controls
          playsinline
          config={{
            file: {
              forceHLS: isHlsUrl(src),
              attributes: {
                controlsList: 'nodownload',
                playsInline: true,
              },
            },
          }}
          style={{ background: '#000' }}
        />
      </div>
    </div>
  )
}
