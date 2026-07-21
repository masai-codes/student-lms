import type {
  ResourceKind,
  ResourcePhase,
} from '@/server/learn/resourceDetailTypes'

type ResourcePhaseCopy = {
  title: string
  description: string
}

const COPY: Record<ResourceKind, Record<ResourcePhase, ResourcePhaseCopy>> = {
  'pre-read': {
    before: {
      title: 'Pre-read not available yet',
      description:
        'This pre-read material unlocks at the scheduled time. Return here when it opens to start reading.',
    },
    during: {
      title: 'Pre-read is available',
      description:
        'Read through the material below. Use discussions on the right if you have questions.',
    },
    after: {
      title: 'Pre-read window has ended',
      description:
        'The scheduled window for this pre-read has passed. You can still review the material below.',
    },
  },
  notes: {
    before: {
      title: 'Notes not available yet',
      description:
        'These notes unlock at the scheduled time. Check back when the session opens.',
    },
    during: {
      title: 'Notes are available',
      description:
        'Review the notes below. Discussions are available on the right.',
    },
    after: {
      title: 'Notes window has ended',
      description:
        'The scheduled window has ended. You can still review the notes below.',
    },
  },
  material: {
    before: {
      title: 'Resource not available yet',
      description:
        'This resource unlocks at the scheduled time. Return when it opens to access the content.',
    },
    during: {
      title: 'Resource is available',
      description:
        'Access the resource content below. Ask questions in discussions on the right.',
    },
    after: {
      title: 'Resource window has ended',
      description:
        'The availability window has ended. You can still review the content below.',
    },
  },
}

export function getResourcePhaseCopy(
  kind: ResourceKind,
  phase: ResourcePhase,
): ResourcePhaseCopy {
  return COPY[kind][phase]
}
