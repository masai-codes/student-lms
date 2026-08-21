import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  generateText: vi.fn(),
  ensureAnthropicConfigured: vi.fn(),
  getAiTutorChatModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: hoisted.generateText,
}))

vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  ensureAnthropicConfigured: hoisted.ensureAnthropicConfigured,
  getAiTutorChatModel: hoisted.getAiTutorChatModel,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getAiTutorChatModel.mockReturnValue('mock-model')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateLectureNotesTocFromMarkdown', () => {
  it('returns the generated table of contents', async () => {
    hoisted.generateText.mockResolvedValueOnce({
      text: '- Arrays\n  - Bubble sort',
    })

    const { generateLectureNotesTocFromMarkdown } =
      await import('../services/generateLectureNotesTocFromMarkdown')
    await expect(
      generateLectureNotesTocFromMarkdown('# Arrays\n\n## Bubble sort'),
    ).resolves.toBe('- Arrays\n  - Bubble sort')

    expect(hoisted.ensureAnthropicConfigured).toHaveBeenCalled()
    expect(hoisted.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        prompt: '# Arrays\n\n## Bubble sort',
      }),
    )
  })

  it('throws when the model returns an empty outline', async () => {
    hoisted.generateText.mockResolvedValueOnce({ text: '   ' })

    const { generateLectureNotesTocFromMarkdown } =
      await import('../services/generateLectureNotesTocFromMarkdown')
    await expect(
      generateLectureNotesTocFromMarkdown('# Arrays'),
    ).rejects.toMatchObject({
      code: 'AI_TUTOR_NOTES_TOC_GENERATION_FAILED',
    })
  })
})
