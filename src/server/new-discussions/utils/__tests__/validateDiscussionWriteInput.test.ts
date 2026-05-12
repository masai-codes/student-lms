import { describe, expect, it } from 'vitest'

import {
  DISCUSSION_ATTACHMENT_APPEND_MARKER,
  parseCreateDiscussionInput,
  parseReplyMessage,
} from '@/server/new-discussions/utils/validateDiscussionWriteInput'

describe('validateDiscussionWriteInput', () => {
  it('parseCreateDiscussionInput trims and validates lengths', () => {
    expect(
      parseCreateDiscussionInput({
        title: '  Hi ',
        message: ' Question ',
      })
    ).toEqual({ title: 'Hi', message: 'Question' })
  })

  it('parseCreateDiscussionInput rejects empty title', () => {
    expect(() =>
      parseCreateDiscussionInput({
        title: '   ',
        message: 'x',
      })
    ).toThrow('INVALID_DISCUSSION_TITLE')
  })

  it('parseReplyMessage rejects empty body', () => {
    expect(() => parseReplyMessage('   ')).toThrow('INVALID_REPLY_MESSAGE')
  })

  it('parseCreateDiscussionInput validates plain length for HTML body only', () => {
    expect(
      parseCreateDiscussionInput({
        title: 'T',
        message: '<p>Hello world</p>',
      }).message
    ).toContain('<p>Hello world</p>')
  })

  it('parseCreateDiscussionInput ignores attachment appendix for length limit', () => {
    const longNames = `${DISCUSSION_ATTACHMENT_APPEND_MARKER}${'x'.repeat(5000)}`
    expect(
      parseCreateDiscussionInput({
        title: 'T',
        message: `<p>ok</p>${longNames}`,
      }).message
    ).toContain(longNames)
  })
})
