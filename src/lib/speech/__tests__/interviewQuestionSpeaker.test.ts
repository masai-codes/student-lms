// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInterviewQuestionSpeaker } from '../interviewQuestionSpeaker'

describe('createInterviewQuestionSpeaker', () => {
  const speak = vi.fn()
  const cancel = vi.fn()

  beforeEach(() => {
    speak.mockClear()
    cancel.mockClear()
    vi.stubGlobal('speechSynthesis', { speak, cancel })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation((text: string) => ({ text })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function spokenTexts(): Array<string> {
    return speak.mock.calls.map((call) => call[0].text)
  }

  it('speaks a sentence as soon as its boundary arrives, buffering the rest', () => {
    const speaker = createInterviewQuestionSpeaker()
    speaker.pushText('Tell me about ')
    speaker.pushText('arrays. How do you')
    expect(spokenTexts()).toEqual(['Tell me about arrays.'])

    speaker.pushText(' handle collisions?')
    expect(spokenTexts()).toEqual([
      'Tell me about arrays.',
      'How do you handle collisions?',
    ])
  })

  it('flushes a trailing fragment with no terminal punctuation on finish()', () => {
    const speaker = createInterviewQuestionSpeaker()
    speaker.pushText('What is your favorite data structure')
    expect(spokenTexts()).toEqual([])

    speaker.finish()
    expect(spokenTexts()).toEqual(['What is your favorite data structure'])
  })

  it('does not speak an empty/whitespace-only finish', () => {
    const speaker = createInterviewQuestionSpeaker()
    speaker.finish()
    expect(speak).not.toHaveBeenCalled()
  })

  it('splits multiple sentences delivered in one chunk', () => {
    const speaker = createInterviewQuestionSpeaker()
    speaker.pushText('First question? Second part follows.')
    expect(spokenTexts()).toEqual(['First question?', 'Second part follows.'])
  })

  it('cancel() clears the buffer and stops any speech in progress', () => {
    const speaker = createInterviewQuestionSpeaker()
    speaker.pushText('partial, no boundary yet')
    speaker.cancel()
    expect(cancel).toHaveBeenCalledTimes(1)

    speaker.finish()
    expect(speak).not.toHaveBeenCalled()
  })

  it('does nothing when speechSynthesis is unavailable', () => {
    vi.unstubAllGlobals()
    const speaker = createInterviewQuestionSpeaker()
    expect(() => {
      speaker.pushText('Hello there. ')
      speaker.finish()
      speaker.cancel()
    }).not.toThrow()
  })
})
