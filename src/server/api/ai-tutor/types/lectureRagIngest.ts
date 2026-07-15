export type LectureRagSourceType = 'notes'

export type RagPlatformJobResponse = {
  job_id: string
  status: string
  job_type?: string | null
  error_message?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type LectureRagIngestJob = {
  sourceType: LectureRagSourceType
  documentId: string
  documentName: string
  jobId: string
  status: string
}

export type IngestLectureRagResponse = {
  lectureId: number
  notesRagged: boolean
  notesCharacterCount: number
  notesToc: string | null
  collectionName: string | null
  jobs: Array<LectureRagIngestJob>
}

export type LectureRagContent = {
  lectureId: number
  notes: string | null
  batchId: number | null
  sectionId: number | null
}
