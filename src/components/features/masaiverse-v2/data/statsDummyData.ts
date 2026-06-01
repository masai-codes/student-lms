import type { MasaiverseStat } from '../types'

/** Dummy stats, shaped like the eventual home API response. */
export const STATS_DUMMY_DATA: Array<MasaiverseStat> = [
  {
    id: 'learners',
    emoji: '🔥',
    value: '2,841',
    label: 'learners in community',
    accent: 'orange',
  },
  {
    id: 'discussions',
    emoji: '💬',
    value: '38',
    label: 'discussions this week',
    accent: 'green',
  },
  {
    id: 'events',
    emoji: '🎯',
    value: '6',
    label: 'events this month',
    accent: 'purple',
  },
  {
    id: 'projects',
    emoji: '⚡',
    value: '124',
    label: 'projects submitted',
    accent: 'blue',
  },
]
