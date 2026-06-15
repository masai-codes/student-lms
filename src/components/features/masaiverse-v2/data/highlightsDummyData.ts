import type { MasaiverseHighlight } from '../types'

/** Dummy "Last week's highlights" recap cards, shaped like the home API response. */
export const HIGHLIGHTS_DUMMY_DATA: Array<MasaiverseHighlight> = [
  {
    id: 'data-science-amazon',
    emoji: '🎤',
    category: 'INDUSTRY TALK · RECAP',
    title: 'How I got into Data Science at Amazon',
    meta: [
      { emoji: '👥', text: '312 attended' },
      { emoji: '⭐', text: '4.8 rating' },
    ],
    ctaLabel: 'Watch replay',
    ctaTone: 'green',
  },
  {
    id: 'build-sprint-11',
    emoji: '⚡',
    accentColor: '#7C3AED',
    category: 'WEEKLY HACKATHON · RESULTS',
    title: 'Build Sprint #11 — Winners Announced!',
    meta: [
      { emoji: '🏆', text: '43 submissions' },
      { emoji: '🎯', text: 'Top 3 live' },
    ],
    ctaLabel: 'See results',
    ctaTone: 'purple',
  },
]
