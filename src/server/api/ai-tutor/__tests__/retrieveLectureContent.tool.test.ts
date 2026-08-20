import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  retrieveLectureRagChunksForTool: vi.fn(),
  tool: vi.fn((definition: unknown) => definition),
}))

vi.mock('ai', () => ({
  tool: hoisted.tool,
}))

vi.mock(
  '@/server/api/ai-tutor/services/retrieveLectureRagChunks.service',
  () => ({
    retrieveLectureRagChunksForTool: hoisted.retrieveLectureRagChunksForTool,
  }),
)

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.retrieveLectureRagChunksForTool.mockResolvedValue('chunk text')
})

describe('createRetrieveLectureContentTool', () => {
  it('creates a tool that forwards query and top_k to retrieval', async () => {
    const { createRetrieveLectureContentTool } =
      await import('../tools/retrieveLectureContent.tool')
    const tools = createRetrieveLectureContentTool(42)
    const retrieveTool = tools.retrieveLectureContent as unknown as {
      execute: (input: { query: string; top_k: number }) => Promise<string>
    }

    await expect(
      retrieveTool.execute({ query: 'insertion sort complexity', top_k: 5 }),
    ).resolves.toBe('chunk text')

    expect(hoisted.retrieveLectureRagChunksForTool).toHaveBeenCalledWith({
      lectureId: 42,
      query: 'insertion sort complexity',
      topK: 5,
    })
  })
})
