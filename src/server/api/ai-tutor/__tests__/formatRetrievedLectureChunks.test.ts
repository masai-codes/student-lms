import { describe, expect, it } from 'vitest'
import {
  formatRetrievedChunksForPrompt,
  mapRagChunkToRetrieved,
  trimRetrievedChunksToBudget,
} from '@/server/api/ai-tutor/services/formatRetrievedLectureChunks'

describe('mapRagChunkToRetrieved', () => {
  it('maps RAG chunk fields into the prompt shape', () => {
    expect(
      mapRagChunkToRetrieved({
        chunk_id: 'c1',
        document_id: 'd1',
        score: 0.92,
        content: 'Notes body',
        metadata: { source_type: 'notes' },
        document_name: 'lecture-1-notes',
      }),
    ).toEqual({
      content: 'Notes body',
      sourceType: 'notes',
      documentName: 'lecture-1-notes',
      score: 0.92,
    })
  })
})

describe('trimRetrievedChunksToBudget', () => {
  it('keeps chunks until the character budget is reached', () => {
    const chunks = [
      {
        content: 'aaaa',
        sourceType: 'notes',
        documentName: null,
        score: 1,
      },
      {
        content: 'bbbb',
        sourceType: 'notes',
        documentName: null,
        score: 0.9,
      },
      {
        content: 'cccc',
        sourceType: 'notes',
        documentName: null,
        score: 0.8,
      },
    ]

    expect(trimRetrievedChunksToBudget(chunks, 10)).toEqual([
      chunks[0],
      chunks[1],
    ])
  })
})

describe('formatRetrievedChunksForPrompt', () => {
  it('formats chunk labels and scores', () => {
    expect(
      formatRetrievedChunksForPrompt([
        {
          content: 'Transcript excerpt',
          sourceType: 'transcript',
          documentName: 'lecture-2-transcript',
          score: 0.87,
        },
      ]),
    ).toBe('[transcript · score 0.87]\nTranscript excerpt')
  })

  it('returns the empty-retrieval message when there are no chunks', () => {
    expect(formatRetrievedChunksForPrompt([])).toBe(
      'No lecture content was retrieved for this question.',
    )
  })
})
