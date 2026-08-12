import { tool } from 'ai'
import { z } from 'zod'
import { AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME } from '@/server/api/ai-tutor/constants'

const practiceQuestionOptionSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe('Short stable id for this option, e.g. "a", "b", "c", "d"'),
  text: z.string().min(1).describe('The option text shown to the student'),
})

const practiceQuestionSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe('Short stable id for this question, e.g. "q1"'),
  question: z.string().min(1).describe('The question text'),
  options: z
    .array(practiceQuestionOptionSchema)
    .min(2)
    .max(6)
    .describe('2-6 answer options'),
  correctOptionId: z
    .string()
    .min(1)
    .describe(
      'The id of the single correct option — must match one of options[].id',
    ),
  explanation: z
    .string()
    .min(1)
    .optional()
    .describe(
      'One or two sentence explanation of why the correct option is correct, shown to the student after they answer',
    ),
})

const practiceQuestionsInputSchema = z.object({
  topic: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Short label for what these questions cover, e.g. "Array methods"',
    ),
  questions: z
    .array(practiceQuestionSchema)
    .min(1)
    .max(10)
    .describe(
      'Multiple-choice practice questions for the student, each with exactly one correct option',
    ),
})

/**
 * Renders as a quiz card in the chat UI rather than plain text — the model
 * fully authors the quiz content as the tool call's input; `execute` just
 * echoes it back so the AI SDK resolves the tool call.
 */
export function createGeneratePracticeQuestionsTool() {
  return {
    [AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME]: tool({
      description:
        'Generate multiple-choice practice questions for the student to test their understanding of THIS lecture. Call this when the student asks for practice questions, quiz questions, or to test themselves — do not write the questions as plain chat text.',
      inputSchema: practiceQuestionsInputSchema,
      execute: async (input) => input,
    }),
  }
}
