export type OpenApiSchema = {
  type?: string
  enum?: string[]
  properties?: Record<string, OpenApiSchema>
  additionalProperties?: boolean
  description?: string
}

export function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

export function zodTypeToSchema(
  zodType: string,
  arg: string | undefined,
  chain: string,
): OpenApiSchema {
  const optional = /\.optional\b/.test(chain) || /\.nullish\b/.test(chain)
  let schema: OpenApiSchema
  switch (zodType) {
    case 'string':
      schema = { type: 'string' }
      break
    case 'number':
    case 'int':
      schema = { type: 'number' }
      break
    case 'boolean':
      schema = { type: 'boolean' }
      break
    case 'enum': {
      const values = [...(arg ?? '').matchAll(/['"]([^'"]+)['"]/g)].map(
        (m) => m[1],
      )
      schema = values.length
        ? { type: 'string', enum: values }
        : { type: 'string' }
      break
    }
    case 'array':
      schema = { type: 'array' }
      break
    case 'record':
    case 'object':
      schema = { type: 'object', additionalProperties: true }
      break
    default:
      schema = { type: 'string' }
  }
  if (optional) schema.description = 'optional'
  return schema
}

export function tsTypeToSchema(typeText: string): OpenApiSchema {
  const cleaned = typeText.replace(/\s*\|\s*null|\s*\|\s*undefined/g, '').trim()
  if (cleaned === 'string') return { type: 'string' }
  if (cleaned === 'number') return { type: 'number' }
  if (cleaned === 'boolean') return { type: 'boolean' }
  if (cleaned.startsWith('Record<') || cleaned.startsWith('{')) {
    return { type: 'object', additionalProperties: true }
  }
  const stringEnum = [...cleaned.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
  if (stringEnum.length > 0) return { type: 'string', enum: stringEnum }
  return { type: 'string' }
}
