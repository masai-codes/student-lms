import { describe, expect, it } from 'vitest'
import { htmlPlainText } from './html'

describe('htmlPlainText', () => {
  it('strips tags and entities', () => {
    expect(htmlPlainText('<p>Hello <strong>world</strong></p>')).toBe(
      'Hello world',
    )
    expect(htmlPlainText('<p>&nbsp;</p>')).toBe('')
  })

  it('treats an empty paragraph as empty', () => {
    expect(htmlPlainText('<p></p>')).toBe('')
  })
})
