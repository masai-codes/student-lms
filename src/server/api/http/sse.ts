const encoder = new TextEncoder()

export function formatSseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export function createSseResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

export function createSseStreamFromEvents(
  events: AsyncIterable<unknown>,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(formatSseEvent(event)))
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}
