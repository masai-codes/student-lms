import {
  YoutubeDefaultViewIcon,
  YoutubeTheaterModeIcon,
} from './youtubePlayerIcons'

import { cn } from '@/lib/utils'

type LectureTheaterModeIconProps = {
  /** When true, player is in theater mode (show “default view” icon like YouTube). */
  isTheaterMode?: boolean
  className?: string
}

export function LectureTheaterModeIcon({
  isTheaterMode = false,
  className,
}: LectureTheaterModeIconProps) {
  if (isTheaterMode) {
    return <YoutubeDefaultViewIcon className={className} />
  }

  return <YoutubeTheaterModeIcon className={cn(className)} />
}
