import type {
  IngestLectureRagResponse,
  LectureRagIngestJob,
} from '@/server/api/ai-tutor/types/lectureRagIngest'
import {
  deleteRagDocument,
  ensureRagCollection,
  ensureRagPlatformConfigured,
  getRagPlatformCollectionName,
  ingestRagText,
} from '@/server/api/ai-tutor/clients/ragPlatform'
import { AI_TUTOR_INLINE_NOTES_MAX_CHARS } from '@/server/api/ai-tutor/constants'
import { generateLectureNotesTocFromMarkdown } from '@/server/api/ai-tutor/services/generateLectureNotesTocFromMarkdown'
import { getLectureRagContent } from '@/server/api/ai-tutor/services/lectureRagContent.service'
import { saveLectureNotesRagStatus } from '@/server/api/ai-tutor/services/lectureNotesTocStorage.service'

function buildDocumentId(lectureId: number): string {
  return `lecture-${lectureId}-notes`
}

function buildMetadata(
  lectureId: number,
  batchId: number | null,
  sectionId: number | null,
): Record<string, string | number> {
  const metadata: Record<string, string | number> = {
    lecture_id: lectureId,
    source_type: 'notes',
  }
  if (batchId != null) metadata.batch_id = batchId
  if (sectionId != null) metadata.section_id = sectionId
  return metadata
}

function isNotesEligibleForRag(notes: string): boolean {
  return notes.length > AI_TUTOR_INLINE_NOTES_MAX_CHARS
}

async function ingestNotes(input: {
  lectureId: number
  notes: string
  collectionName: string
  batchId: number | null
  sectionId: number | null
}): Promise<LectureRagIngestJob> {
  const documentId = buildDocumentId(input.lectureId)
  await deleteRagDocument(documentId)
  const job = await ingestRagText({
    collectionName: input.collectionName,
    documentId,
    documentName: documentId,
    text: input.notes,
    metadata: buildMetadata(input.lectureId, input.batchId, input.sectionId),
  })

  return {
    sourceType: 'notes',
    documentId,
    documentName: documentId,
    jobId: job.job_id,
    status: job.status,
  }
}

export async function ingestLectureRag(
  lectureId: number,
): Promise<IngestLectureRagResponse> {
  const content = await getLectureRagContent(lectureId)
  const notes = content.notes!
  const notesCharacterCount = notes.length

  if (!isNotesEligibleForRag(notes)) {
    await saveLectureNotesRagStatus({ lectureId, notesRagged: false })
    return {
      lectureId,
      notesRagged: false,
      notesCharacterCount,
      notesToc: null,
      collectionName: null,
      jobs: [],
    }
  }

  ensureRagPlatformConfigured()
  const collectionName = getRagPlatformCollectionName()
  const notesToc = await generateLectureNotesTocFromMarkdown(notes)

  await saveLectureNotesRagStatus({
    lectureId,
    notesRagged: true,
    notesToc,
  })

  await ensureRagCollection(collectionName)
  const job = await ingestNotes({
    lectureId,
    notes,
    collectionName,
    batchId: content.batchId,
    sectionId: content.sectionId,
  })

  return {
    lectureId,
    notesRagged: true,
    notesCharacterCount,
    notesToc,
    collectionName,
    jobs: [job],
  }
}
