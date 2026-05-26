import type { AiChatRole } from '@/server/ai-chat/types'

export const AI_CHAT_SYSTEM_PROMPT = `You are an academic mentor helping a student with doubts about a specific lecture they just attended.

Your responses must:
- Stay focused on this lecture's content; gently redirect off-topic questions.
- Reference the provided lecture summary to ground answers in what was taught.
- Use markdown for code, lists, and emphasis. Inline code uses single backticks. Code blocks use triple backticks.
- Keep replies concise and step-by-step. Ask a short clarifying question if the student's input is ambiguous.

Never invent facts that contradict the lecture summary.`

const LECTURE_CONTEXT_CHAR_BUDGET = 8_000
const HISTORY_PAIRS_FOR_CONTEXT = 8

export type OpenAiChatMessage = {
  role: 'system' | AiChatRole
  content: string
}

function clampLectureContext(text: string): string {
  if (text.length <= LECTURE_CONTEXT_CHAR_BUDGET) return text
  return `${text.slice(0, LECTURE_CONTEXT_CHAR_BUDGET)}…`
}

export function buildChatPromptMessages(input: {
  lectureTitle: string
  lectureSummary: string
  history: ReadonlyArray<{ role: AiChatRole; content: string }>
  userMessage: string
}): Array<OpenAiChatMessage> {
  const recentHistory = input.history.slice(-HISTORY_PAIRS_FOR_CONTEXT * 2)

  const systemContent = [
    AI_CHAT_SYSTEM_PROMPT,
    '',
    `Lecture title: ${input.lectureTitle}`,
    '',
    'Lecture summary (authoritative reference for this conversation):',
    '<lecture_summary>',
    clampLectureContext(input.lectureSummary),
    '</lecture_summary>',
  ].join('\n')

  return [
    { role: 'system', content: systemContent },
    ...recentHistory.map<OpenAiChatMessage>(entry => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: 'user', content: input.userMessage },
  ]
}
