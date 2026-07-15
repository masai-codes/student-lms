import { tool } from 'ai'
import { z } from 'zod'
import {
  AI_TUTOR_LECTURE_RAG_TOOL_NAME,
  AI_TUTOR_RAG_RETRIEVE_TOP_K_MAX,
} from '@/server/api/ai-tutor/constants'
import { retrieveLectureRagChunksForTool } from '@/server/api/ai-tutor/services/retrieveLectureRagChunks.service'

export function createRetrieveLectureContentTool(lectureId: number) {
  return {
    [AI_TUTOR_LECTURE_RAG_TOOL_NAME]: tool({
      description:
        'Search ingested instructor lecture notes for relevant excerpts. Use when the student needs specific details not already covered by the summary or inline notes.',
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe(
            'Focused search query describing the lecture topic or concept to retrieve',
          ),
        top_k: z
          .number()
          .int()
          .min(1)
          .max(AI_TUTOR_RAG_RETRIEVE_TOP_K_MAX)
          .describe('Number of relevant chunks to retrieve'),
      }),
      execute: async ({ query, top_k }) =>
        retrieveLectureRagChunksForTool({
          lectureId,
          query,
          topK: top_k,
        }),
    }),
  }
}
