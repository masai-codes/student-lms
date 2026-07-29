/** Max attachments per support message (matches the legacy limit). */
export const SUPPORT_MAX_ATTACHMENTS = 5

const IMAGE_NAME_RE = /\.(png|jpe?g|gif|webp|svg|bmp)$/i

export function isSupportImageName(name: string): boolean {
  return IMAGE_NAME_RE.test(name)
}

/** Embed uploaded files into a markdown message (images inline, others as links). */
export function embedSupportAttachmentLinks(
  message: string,
  uploaded: Array<{ url: string; name: string }>,
): string {
  if (uploaded.length === 0) return message.trim()

  const links = uploaded
    .map((u) =>
      isSupportImageName(u.name) ? `![${u.name}](${u.url})` : `[${u.name}](${u.url})`,
    )
    .join('\n\n')

  const trimmed = message.trim()
  return trimmed ? `${trimmed}\n\n${links}` : links
}
