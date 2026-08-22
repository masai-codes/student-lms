import {
  Calendar,
  ChatCircle,
  House,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export type MasaiverseV2Tab =
  | 'home'
  | 'clubs'
  | 'events'
  | 'discussions'
  | 'leaderboard'

export type MasaiverseV2NavPath =
  | '/masaiverse/home'
  | '/masaiverse/clubs'
  | '/masaiverse/events'
  | '/masaiverse/discussions'
  | '/masaiverse/leaderboard'

export interface SidebarNavItemConfig {
  id: MasaiverseV2Tab
  label: string
  icon: Icon
  to: MasaiverseV2NavPath
}

/** Static navigation entries for the v2 left sidebar. */
export const SIDEBAR_NAV_ITEMS: Array<SidebarNavItemConfig> = [
  { id: 'home', label: 'Home', icon: House, to: '/masaiverse/home' },
  {
    id: 'clubs',
    label: 'Clubs',
    icon: UsersThree,
    to: '/masaiverse/clubs',
  },
  { id: 'events', label: 'Events', icon: Calendar, to: '/masaiverse/events' },
  {
    id: 'discussions',
    label: 'Discussions',
    icon: ChatCircle,
    to: '/masaiverse/discussions',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    to: '/masaiverse/leaderboard',
  },
]
