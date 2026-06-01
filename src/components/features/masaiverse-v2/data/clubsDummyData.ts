import type { MasaiverseClubDetail } from '../types'

/**
 * Dummy clubs data, shaped like the eventual GET `/api/masaiverse-v2/*`
 * club responses. Used by the clubs listing page and the club detail page
 * until the API is integrated.
 */
export const CLUBS_DUMMY_DATA: Array<MasaiverseClubDetail> = [
  {
    id: 'programming-club',
    name: 'Programming Club',
    icon: '💻',
    category: 'Engineering',
    membersCount: 1240,
    tagline: 'Code · DSA · Projects',
    accent: 'orange',
    description:
      'Build projects, pair on problems, and ship code with fellow learners. Weekly contests and code reviews.',
  },
  {
    id: 'design-circle',
    name: 'Design Circle',
    icon: '🎨',
    category: 'Design',
    membersCount: 860,
    tagline: 'UI/UX · Case Studies',
    accent: 'purple',
    description:
      'A space for product, UI, and UX enthusiasts to share work, run critiques, and grow together.',
  },
  {
    id: 'data-ai-guild',
    name: 'Data & AI Guild',
    icon: '📊',
    category: 'Data',
    membersCount: 1530,
    tagline: 'ML · Analytics · AI',
    accent: 'blue',
    description:
      'Explore machine learning, analytics, and data engineering through hands-on challenges and study jams.',
  },
  {
    id: 'robotics-lab',
    name: 'Robotics Lab',
    icon: '🤖',
    category: 'Hardware',
    membersCount: 420,
    tagline: 'Hardware · Embedded',
    accent: 'green',
    description:
      'Tinker with hardware, automation, and embedded systems. Monthly build nights and demos.',
  },
  {
    id: 'product-guild',
    name: 'Product Guild',
    icon: '🧭',
    category: 'Product',
    membersCount: 690,
    tagline: 'Discovery · Roadmaps',
    accent: 'orange',
    description:
      'Learn product thinking, roadmapping, and discovery with case studies and mock interviews.',
  },
  {
    id: 'writers-room',
    name: 'Writers Room',
    icon: '✍️',
    category: 'Communication',
    membersCount: 350,
    tagline: 'Writing · Storytelling',
    accent: 'purple',
    description:
      'Sharpen technical writing and storytelling. Share drafts and get thoughtful feedback.',
  },
]

export function findClubById(
  clubId: string,
): MasaiverseClubDetail | undefined {
  return CLUBS_DUMMY_DATA.find((club) => club.id === clubId)
}
