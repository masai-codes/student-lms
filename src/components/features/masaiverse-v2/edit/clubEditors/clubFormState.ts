import type { KeyValueItem } from './KeyValueListEditor'
import type { LearningTenureItem } from './LearningTenureEditor'
import type { MasaiverseV2EntityPatch } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export type ClubFormState = {
  name: string
  description: string
  cardImageLink: string
  galleryImages: Array<string>
  /** Kept as a string for the number input; coerced on save. */
  projectsBuild: string
  cardDescription: string
  aboutCardDetails: Array<KeyValueItem>
  belowTitleCardText: string
  learningTenureData: Array<LearningTenureItem>
  clubDetailBannerTags: Array<string>
  confirmationModalText: string
  learningTenureDateText: string
  /** Whether the club is published (visible to students). */
  isPublished: boolean
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function strList(value: unknown): Array<string> {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function kvList(value: unknown): Array<KeyValueItem> {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === 'object'),
    )
    .map((entry) => ({ heading: str(entry.heading), value: str(entry.value) }))
}

function tenureList(value: unknown): Array<LearningTenureItem> {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === 'object'),
    )
    .map((entry) => ({
      emoji: str(entry.emoji),
      heading: str(entry.heading),
      text: str(entry.text),
      tags: strList(entry.tags),
    }))
}

/** Builds the editable form state from the raw club name + meta. */
export function toClubFormState(data: {
  name: string
  meta: Record<string, unknown>
}): ClubFormState {
  const meta = data.meta
  return {
    name: data.name,
    description: str(meta.description),
    cardImageLink: str(meta.cardImageLink),
    galleryImages: strList(meta.galleryImages),
    projectsBuild:
      typeof meta.projectsBuild === 'number'
        ? String(meta.projectsBuild)
        : str(meta.projectsBuild),
    cardDescription: str(meta.cardDescription),
    aboutCardDetails: kvList(meta.aboutCardDetails),
    belowTitleCardText: str(meta.belowTitleCardText),
    learningTenureData: tenureList(meta.learningTenureData),
    clubDetailBannerTags: strList(meta.clubDetailBannerTags),
    confirmationModalText: str(meta.confirmationModalText),
    learningTenureDateText: str(meta.learningTenureDateText),
    isPublished: meta.isPublished === true,
  }
}

/** Builds the update patch (name column + meta keys) from the form state. */
export function toClubPatch(state: ClubFormState): MasaiverseV2EntityPatch {
  const projects = Number(state.projectsBuild)
  return {
    column: { name: state.name },
    meta: {
      description: state.description,
      cardImageLink: state.cardImageLink,
      galleryImages: state.galleryImages,
      projectsBuild: Number.isFinite(projects) ? projects : 0,
      cardDescription: state.cardDescription,
      aboutCardDetails: state.aboutCardDetails,
      belowTitleCardText: state.belowTitleCardText,
      learningTenureData: state.learningTenureData,
      clubDetailBannerTags: state.clubDetailBannerTags,
      confirmationModalText: state.confirmationModalText,
      learningTenureDateText: state.learningTenureDateText,
      isPublished: state.isPublished,
    },
  }
}
