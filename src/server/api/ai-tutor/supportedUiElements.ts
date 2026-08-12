import { ApiError } from '@/server/api/http/apiError'

export type AiTutorSupportedUiElement = 'quiz'

const AI_TUTOR_SUPPORTED_UI_ELEMENTS: ReadonlyArray<AiTutorSupportedUiElement> =
  ['quiz']

function isAiTutorSupportedUiElement(
  value: unknown,
): value is AiTutorSupportedUiElement {
  return (
    typeof value === 'string' &&
    AI_TUTOR_SUPPORTED_UI_ELEMENTS.includes(value as AiTutorSupportedUiElement)
  )
}

/**
 * Declares which structured UI elements the caller can render. Missing/`null`
 * defaults to `[]` (no structured elements) so older clients — e.g. the
 * mobile app, which hasn't rolled out quiz-card support yet — keep getting
 * plain-text output instead of tool-call JSON they can't render.
 */
export function parseSupportedUiElements(
  value: unknown,
): Array<AiTutorSupportedUiElement> {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new ApiError(400, 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID')
  }

  for (const item of value) {
    if (!isAiTutorSupportedUiElement(item)) {
      throw new ApiError(400, 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID')
    }
  }

  return value as Array<AiTutorSupportedUiElement>
}
