import { describe, expect, it } from 'vitest'
import {
  createSseStreamFromEvents,
  formatSseEvent,
} from '@/server/api/http/sse'

describe('formatSseEvent', () => {
  it('serializes data as an SSE frame', () => {
    expect(formatSseEvent({ type: 'token', content: 'Hi' })).toBe(
      'data: {"type":"token","content":"Hi"}\n\n',
    )
  })
})

describe('createSseStreamFromEvents', () => {
  it('encodes each async event as SSE data frames', async () => {
    async function* events() {
      yield { type: 'token', content: 'Hello' }
      yield { type: 'done' }
    }

    const stream = createSseStreamFromEvents(events())
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let output = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      output += decoder.decode(value)
    }

    expect(output).toBe(
      'data: {"type":"token","content":"Hello"}\n\n' +
        'data: {"type":"done"}\n\n',
    )
  })

  it('propagates generator failures to the stream consumer', async () => {
    async function* events() {
      yield { type: 'token', content: 'Hello' }
      throw new Error('stream failed')
    }

    const stream = createSseStreamFromEvents(events())
    const reader = stream.getReader()

    await expect(reader.read()).resolves.toEqual({
      done: false,
      value: expect.any(Uint8Array),
    })
    await expect(reader.read()).rejects.toThrow('stream failed')
  })
})
