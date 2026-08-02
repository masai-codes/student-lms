import { describe, expect, it } from 'vitest'
import { createIncrementalJsonStringExtractor } from '../jsonStringFieldExtractor'

describe('createIncrementalJsonStringExtractor', () => {
  it('extracts a value streamed across several chunks, in order', () => {
    // Real chunk boundaries captured from a live OpenRouter stream.
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')

    const events1 = extractor.push(
      '{"nextQuestion": "Hi! Could you explain the difference between',
    )
    const events2 = extractor.push(
      ' an array and a linked list?", "transcript": "Hi! Could you explain the difference between',
    )
    const events3 = extractor.push(' an array and a linked list?"}')

    const deltas = [...events1, ...events2, ...events3]
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')

    expect(deltas).toBe(
      'Hi! Could you explain the difference between an array and a linked list?',
    )
    expect(events2.some((e) => e.type === 'end')).toBe(true)
  })

  it('extracts a value that arrives in a single chunk', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events = extractor.push(
      '{"nextQuestion":"How do you handle collisions?","transcript":"..."}',
    )
    const deltas = events
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')
    expect(deltas).toBe('How do you handle collisions?')
    expect(events.some((e) => e.type === 'end')).toBe(true)
  })

  it('emits a null event when the field is JSON null', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events = extractor.push('{"nextQuestion":null,"transcript":"done"}')
    expect(events).toEqual([{ type: 'null' }])
  })

  it('handles escaped quotes and backslashes inside the string', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events = extractor.push(
      String.raw`{"nextQuestion":"She said \"hi\" then \\ paused","transcript":"x"}`,
    )
    const deltas = events
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')
    expect(deltas).toBe('She said "hi" then \\ paused')
  })

  it('does not fire on a field name that is a prefix of another key', () => {
    const extractor = createIncrementalJsonStringExtractor('question')
    const events = extractor.push('{"nextQuestion":"nope","question":"yes"}')
    const deltas = events
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')
    expect(deltas).toBe('yes')
  })

  it('handles a marker split across chunk boundaries', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events1 = extractor.push('{"next')
    const events2 = extractor.push('Question":"hel')
    const events3 = extractor.push('lo"}')
    const deltas = [...events1, ...events2, ...events3]
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')
    expect(deltas).toBe('hello')
  })

  it('handles an escape sequence split across chunk boundaries', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events1 = extractor.push('{"nextQuestion":"say \\')
    const events2 = extractor.push('"hi\\""}')
    const deltas = [...events1, ...events2]
      .filter((e) => e.type === 'delta')
      .map((e) => e.text)
      .join('')
    expect(deltas).toBe('say "hi"')
  })

  it('produces no delta/end events when the key never appears', () => {
    const extractor = createIncrementalJsonStringExtractor('nextQuestion')
    const events = extractor.push('{"transcript":"only this field"}')
    expect(events).toEqual([])
  })
})
