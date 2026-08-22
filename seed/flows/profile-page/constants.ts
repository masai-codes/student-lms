/** Seeded into `sections.settings` to make one acknowledgement pending. */
export const PROFILE_UNDERTAKING_TEMPLATE = {
  shouldModalBeVisible: true,
  heading: 'Code of Conduct',
  pdfUrl:
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
} as const

interface ProfileBadgeSpec {
  title: string
  description: string
  lockedDescription: string
  linkedinShareText: string
  theme: string
  /** Earned badges get a `user_badges` row; the rest render locked. */
  isEarned: boolean
}

/** One earned + one locked badge per module, to show both states together. */
export const PROFILE_BADGES: ReadonlyArray<ProfileBadgeSpec> = [
  {
    title: 'First Steps',
    description: 'Completed your first lecture in this module.',
    lockedDescription: 'Watch your first lecture to unlock this badge.',
    linkedinShareText: 'I earned the First Steps badge at Masai.',
    theme: 'theme1',
    isEarned: true,
  },
  {
    title: 'Module Master',
    description: 'Scored above 90% across every assignment in this module.',
    lockedDescription: 'Score above 90% on every assignment to unlock this.',
    linkedinShareText: 'I earned the Module Master badge at Masai.',
    theme: 'theme2',
    isEarned: false,
  },
]

/** Three device shapes so Account Activity shows all three icons. */
export const PROFILE_SEED_DEVICES = [
  {
    label: 'Chrome on macOS',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    label: 'Safari on iPhone',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    label: 'Safari on iPad',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
] as const
