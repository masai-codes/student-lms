function parseMessageContent(text) {
  const lines = text.split('\n')
  const attachments = []

  let lastTextIndex = -1 // Let's change how we initialize it
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (!line) continue

    const linkMatch = line.match(/^(!?)\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      attachments.unshift({
        isImage: !!linkMatch[1],
        name: linkMatch[2],
        url: linkMatch[3],
      })
    } else {
      lastTextIndex = i
      break
    }
  }

  const cleanText =
    lastTextIndex >= 0
      ? lines
          .slice(0, lastTextIndex + 1)
          .join('\n')
          .trim()
      : ''
  return { cleanText, attachments }
}

const input1 = 'This is image\n\n![chat-ai.png](url)'
const input2 = '![chat-ai.png](url)'

console.log('input1', parseMessageContent(input1))
console.log('input2', parseMessageContent(input2))
