// remark-math only understands dollar delimiters: `$...$` for inline math and
// `$$...$$` for display math. Authored content frequently uses LaTeX-style
// `\(...\)` / `\[...\]` delimiters, so we rewrite those to dollar delimiters.
//
// Math spans are also extracted *before* decodeMarkdownPayload runs, because its
// `\n` / `\t` / `\r` un-escaping corrupts LaTeX commands such as `\to`, `\theta`
// and `\nabla` (backslash + t/n/r). We mask each span with a sentinel, let the
// rest of the pipeline decode/normalise, then restore the math verbatim.

// Order matters: `$$...$$` and `\[...\]` (display) are matched before the
// single-delimiter inline forms so opening `$$` is never split into empty `$$`.
const MATH_SPAN_PATTERN =
  /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$/g

// U+E000 is a Private Use Area character: it will not appear in real content and
// survives HTML parsing (unlike U+0000, which the parser replaces with U+FFFD).
export const MATH_SENTINEL = '\uE000'
const TOKEN_PATTERN = /\uE000MATH(\d+)\uE000/g

function toDollarDelimiters(math: string): string {
  if (math.startsWith('\\[') && math.endsWith('\\]')) {
    return `$$${math.slice(2, -2)}$$`
  }
  if (math.startsWith('\\(') && math.endsWith('\\)')) {
    return `$${math.slice(2, -2)}$`
  }
  return math
}

export function protectMathSpans(value: string): {
  masked: string
  restore: (input: string) => string
} {
  const spans: string[] = []

  const masked = value.replace(MATH_SPAN_PATTERN, (match) => {
    const token = `${MATH_SENTINEL}MATH${spans.length}${MATH_SENTINEL}`
    spans.push(toDollarDelimiters(match))
    return token
  })

  const restore = (input: string): string =>
    input.replace(TOKEN_PATTERN, (_token, index) => spans[Number(index)] ?? '')

  return { masked, restore }
}
