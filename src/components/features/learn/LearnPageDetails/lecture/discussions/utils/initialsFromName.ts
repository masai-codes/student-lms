export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}
