import { defaultSchema } from 'rehype-sanitize'
import type { Options as SanitizeOptions } from 'rehype-sanitize'

export const markdownSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'video'],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    video: [
      'src',
      'controls',
      'poster',
      'preload',
      'playsInline',
      'muted',
      'loop',
      'width',
      'height',
    ],
    source: [...(defaultSchema.attributes?.source ?? []), 'src', 'type'],
  },
}
