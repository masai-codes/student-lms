import type { MasaiverseV2ClubStats } from '@/server/api/masaiverse-v2/services/getClubStats.service'
import type { AccentColor } from '../../types'

export interface ClubStatCardConfig {
  id: string
  emoji: string
  label: string
  /** Optional smaller line under the label clarifying the metric's window. */
  sublabel?: string
  accent: AccentColor
  /** Which field of the club-stats payload this card displays. */
  metric: keyof MasaiverseV2ClubStats
  /** `rating` renders one decimal; `count` renders a localized integer. */
  format: 'count' | 'rating'
}

/** Static presentation for the club detail stat cards; values come from the API. */
export const CLUB_STAT_CARDS: Array<ClubStatCardConfig> = [
  {
    id: 'active-members',
    emoji: '👥',
    label: 'Active Members',
    sublabel: 'in the last 30 days',
    accent: 'orange',
    metric: 'activeMembers',
    format: 'count',
  },
  {
    id: 'avg-event-rating',
    emoji: '⭐',
    label: 'Avg event rating',
    accent: 'purple',
    metric: 'avgEventRating',
    format: 'rating',
  },
  {
    id: 'projects-built',
    emoji: '🏗️',
    label: 'Projects built',
    accent: 'green',
    metric: 'projectsBuilt',
    format: 'count',
  },
  {
    id: 'community-posts',
    emoji: '💬',
    label: 'Community Discussions',
    accent: 'blue',
    metric: 'communityPosts',
    format: 'count',
  },
]

/** Formats a stat value for display, with `—` for missing data. */
export function formatClubStat(
  card: ClubStatCardConfig,
  stats: MasaiverseV2ClubStats | undefined,
): string {
  if (!stats) return '—'
  const value = stats[card.metric]
  if (value == null) return '—'
  if (card.format === 'rating') return Number(value).toFixed(1)
  return Number(value).toLocaleString('en-IN')
}
