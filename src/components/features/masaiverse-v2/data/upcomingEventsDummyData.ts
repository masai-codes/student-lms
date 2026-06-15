import type { MasaiverseUpcomingEvent } from '../types'

/** Dummy "Upcoming events" list shown in the calendar drawer. */
export const UPCOMING_EVENTS_DUMMY_DATA: Array<MasaiverseUpcomingEvent> = [
  {
    id: 'industry-talk',
    day: '22',
    month: 'MAY',
    title: 'Industry Talk: Product Roles at Startups',
    subtitle: '🔴 Live · 7 PM IST',
    ctaLabel: 'RSVP',
  },
  {
    id: 'hackarena',
    day: '28',
    month: 'MAY',
    title: 'HackArena Monthly Hackathon',
    subtitle: '🏆 48 hrs · teams of 2–4',
    ctaLabel: 'Join',
  },
  {
    id: 'ai-agents',
    day: '30',
    month: 'MAY',
    title: 'AI Agents Workshop',
    subtitle: '🖥️ Skill workshop · hands-on',
    ctaLabel: 'Register',
  },
]
