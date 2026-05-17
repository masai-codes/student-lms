'use client'

import ReactPlayer from 'react-player/lazy'

import './lectureReactPlayer.css'

import { cn } from '@/lib/utils'

type LectureReactPlayerProps = {
  src: string
  className?: string
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function LectureReactPlayer({ src, className }: LectureReactPlayerProps) {
  return (
    <div
      className={cn(
        'lecture-react-player flex h-full min-h-0 w-full flex-1 flex-col bg-black',
        className,
      )}
    >
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
