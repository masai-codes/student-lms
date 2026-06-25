/** Max user message length accepted by the streaming chat endpoint. */
export const AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH = 4_000

/** Max feedback text length persisted on `ai_chat_practice_questions.feedback`. */
export const AI_TUTOR_FEEDBACK_MAX_LENGTH = 191

/** Fallback title when a conversation has no user messages yet. */
export const AI_TUTOR_DEFAULT_CONVERSATION_TITLE = 'New chat'

/** Max characters shown in conversation list titles. */
export const AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH = 50

/** Default Claude model; override with `ANTHROPIC_MODEL`. */
export const AI_TUTOR_CHAT_DEFAULT_MODEL = 'claude-haiku-4-5'

/** Mirrors the lecture chat system prompt from experience-api. */
export const AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT = `As a chatbot assistant, you provide helpful responses to students' doubts after lectures. To do this effectively, you must thoroughly review the lecture material and provide the best possible answers. If a student struggles with a particular concept, refer to the summary. If the concept is not found in the summary, rely on your knowledge to help resolve the doubt.

Your response must use markdown formatting.
Output inline code example: \`var\`
Output code block example:
\`\`\`
const a = 10;
\`\`\`;`
