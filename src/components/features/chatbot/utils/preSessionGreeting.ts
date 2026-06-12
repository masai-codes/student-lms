export function buildPreSessionGreeting(userName: string, lectureLabel = 'the lecture'): string {
  const trimmed = userName.trim()
  const firstName = trimmed.split(/\s+/)[0] ?? trimmed
  const safeName = firstName.length > 0 ? firstName : 'there'
  return `Hi ${safeName}! Ask me anything about ${lectureLabel}.`
}
