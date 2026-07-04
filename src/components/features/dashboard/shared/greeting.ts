/** Max characters shown for the greeting name before we shorten it. */
const MAX_GREETING_NAME_LENGTH = 20

/**
 * Keeps the greeting compact for long names:
 * - short names are shown in full;
 * - long full names fall back to just the first name;
 * - a still-too-long first name is truncated with an ellipsis.
 *
 * The full name should still be exposed (e.g. a `title` tooltip) by the caller.
 */
export function formatGreetingName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length <= MAX_GREETING_NAME_LENGTH) return trimmed

  const [firstName = trimmed] = trimmed.split(/\s+/)
  if (firstName.length <= MAX_GREETING_NAME_LENGTH) return firstName

  return `${firstName.slice(0, MAX_GREETING_NAME_LENGTH - 1)}…`
}
