import { describe, expect, it } from 'vitest'
import { parseCreateSessionRequest } from '../parseCreateSessionRequest'

function req(body: unknown) {
  return new Request('http://localhost/api/interviews/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('parseCreateSessionRequest', () => {
  it('throws INTERVIEW_TOPIC_INVALID when topicId is missing', async () => {
    await expect(parseCreateSessionRequest(req({}))).rejects.toMatchObject({
      code: 'INTERVIEW_TOPIC_INVALID',
    })
  })

  it('leaves subtopics undefined when absent', async () => {
    const result = await parseCreateSessionRequest(req({ topicId: 'dsa' }))
    expect(result.subtopics).toBeUndefined()
  })

  it('parses a valid subtopics array', async () => {
    const result = await parseCreateSessionRequest(
      req({ topicId: 'dsa', subtopics: ['Big-O', 'Linear search'] }),
    )
    expect(result.subtopics).toEqual(['Big-O', 'Linear search'])
  })

  it('drops non-string entries from subtopics', async () => {
    const result = await parseCreateSessionRequest(
      req({ topicId: 'dsa', subtopics: ['Big-O', 42, null, 'Linear search'] }),
    )
    expect(result.subtopics).toEqual(['Big-O', 'Linear search'])
  })

  it('leaves subtopics undefined when not an array', async () => {
    const result = await parseCreateSessionRequest(
      req({ topicId: 'dsa', subtopics: 'not-an-array' }),
    )
    expect(result.subtopics).toBeUndefined()
  })
})
