export function discussionAvatarUrl(
  name: string,
  profileImageUrl: string | null | undefined,
): string {
  if (profileImageUrl != null && profileImageUrl.trim() !== '') {
    return profileImageUrl.trim()
  }
  const label = name.trim() || 'Student'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=E5E7EB&color=374151`
}
