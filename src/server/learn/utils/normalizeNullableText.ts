export function normalizeNullableText(
  value: string | null | undefined,
): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
