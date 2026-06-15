/** Up to two initials from a name, uppercased; "?" when the name is blank. */
export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
  return initials || '?'
}

/** Soft background + strong text colors for an initials avatar. */
export interface AvatarPalette {
  bg: string
  text: string
}

const AVATAR_PALETTES: Array<AvatarPalette> = [
  { bg: '#FCE9E3', text: '#C2410C' },
  { bg: '#E0EBFD', text: '#2563EB' },
  { bg: '#ECE6FB', text: '#6D28D9' },
  { bg: '#E1F3E8', text: '#1F8A4C' },
  { bg: '#FBEBD2', text: '#B45309' },
]

/** Deterministic palette for a user id, so a member keeps the same color. */
export function getAvatarPalette(userId: string): AvatarPalette {
  let hash = 0
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) % AVATAR_PALETTES.length
  }
  return AVATAR_PALETTES[hash]
}

/** Medal emoji for the top three ranks; null otherwise. */
export function getRankMedal(rank: number): string | null {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}
