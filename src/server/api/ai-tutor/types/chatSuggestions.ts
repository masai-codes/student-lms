export type LectureAiChatSuggestionIcon = 'faq' | 'summary' | 'explain' | 'quiz'

/** One suggestion shown in the lecture AI chat empty state. */
export type LectureAiChatSuggestion = {
  icon: LectureAiChatSuggestionIcon
  question: string
}
