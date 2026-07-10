import { generateText } from 'ai'
import {
  ensureAnthropicConfigured,
  getAiTutorChatModel,
} from '@/server/api/ai-tutor/clients/anthropicModel'
import { AI_TUTOR_NOTES_TOC_SYSTEM_PROMPT } from '@/server/api/ai-tutor/constants'
import { ApiError } from '@/server/api/http/apiError'

export async function generateLectureNotesTocFromMarkdown(
  notes: string,
): Promise<string> {
  ensureAnthropicConfigured()

  const result = await generateText({
    model: getAiTutorChatModel(),
    system: AI_TUTOR_NOTES_TOC_SYSTEM_PROMPT,
    prompt: notes,
  })

  const notesToc = result.text.trim()
  if (!notesToc) {
    throw new ApiError(503, 'AI_TUTOR_NOTES_TOC_GENERATION_FAILED')
  }

  return notesToc
}
