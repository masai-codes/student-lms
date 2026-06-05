import type { MasaiverseV2CommunityStats } from '@/server/api/masaiverse-v2/getMasaiverseV2Home.service'
import type { AccentColor } from '../types'

export interface StatCardConfig {
  id: string
  emoji: string
  label: string
  accent: AccentColor
  /** Which numeric field of the home API's `stats` this card displays. */
  metric: keyof MasaiverseV2CommunityStats
}

/** Static presentation for each Section-1 stat card; counts come from the API. */
export const STAT_CARDS: Array<StatCardConfig> = [
  {
    id: 'learners',
    emoji: '🔥',
    label: 'learners in community',
    accent: 'orange',
    metric: 'learnersInCommunity',
  },
  {
    id: 'discussions',
    emoji: '💬',
    label: 'discussions this week',
    accent: 'green',
    metric: 'discussionsThisWeek',
  },
  {
    id: 'events',
    emoji: '🎯',
    label: 'events this year',
    accent: 'purple',
    metric: 'eventsThisYear',
  },
  {
    id: 'registrations',
    emoji: '⚡',
    label: 'event registrations',
    accent: 'blue',
    metric: 'eventRegistrationsThisYear',
  },
]
