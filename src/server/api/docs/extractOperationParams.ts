import {
  findMatchingBrace,
  tsTypeToSchema,
  zodTypeToSchema,
  type OpenApiSchema,
} from '@/server/api/docs/schemaFromText'

export type { OpenApiSchema }

export type ScannedQueryParam = {
  name: string
  schema: OpenApiSchema
}

export type ScannedRequestBody = {
  required: boolean
  schema: OpenApiSchema
}

/**
 * Pull query param names from `searchParams.get('…')` / `params.get('…')`.
 */
export function extractQueryParams(source: string): ScannedQueryParam[] {
  const names = new Set<string>()
  const re = /(?:searchParams|\bparams)\s*\.\s*get\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const match of source.matchAll(re)) {
    names.add(match[1])
  }
  return [...names].sort().map((name) => ({
    name,
    schema: { type: 'string' },
  }))
}

/**
 * Best-effort JSON body shape from Zod object schemas and `as { … }` casts.
 */
export function extractRequestBody(source: string): ScannedRequestBody | null {
  const properties: Record<string, OpenApiSchema> = {}

  for (const objectBody of findZodObjectBodies(source)) {
    Object.assign(properties, parseZodObjectProperties(objectBody))
  }
  for (const castBody of findTypeAssertionBodies(source)) {
    Object.assign(properties, parseTypeAssertionProperties(castBody))
  }

  for (const match of source.matchAll(
    /(?:body|rawBody|payload)\s*(?:as\s*\{[^}]*\})?\s*\.\s*([A-Za-z_]\w*)/g,
  )) {
    if (!(match[1] in properties)) properties[match[1]] = { type: 'string' }
  }
  for (const match of source.matchAll(
    /['"]([A-Za-z_]\w*)['"]\s+in\s+(?:body|rawBody|payload)/g,
  )) {
    if (!(match[1] in properties)) properties[match[1]] = { type: 'string' }
  }

  const usesJson =
    /\brequest\.json\s*\(/.test(source) || /\.json\(\s*\)/.test(source)

  if (Object.keys(properties).length === 0) {
    if (!usesJson) return null
    return {
      required: true,
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'JSON body (fields not auto-detected)',
      },
    }
  }

  return {
    required: true,
    schema: { type: 'object', properties },
  }
}

function findZodObjectBodies(source: string): string[] {
  const bodies: string[] = []
  const needle = 'z.object('
  let from = 0
  while (from < source.length) {
    const start = source.indexOf(needle, from)
    if (start < 0) break
    const openBrace = source.indexOf('{', start + needle.length)
    if (openBrace < 0) break
    const close = findMatchingBrace(source, openBrace)
    if (close < 0) break
    bodies.push(source.slice(openBrace + 1, close))
    from = close + 1
  }
  return bodies
}

function findTypeAssertionBodies(source: string): string[] {
  const bodies: string[] = []
  const re = /\bas\s*\{/g
  for (const match of source.matchAll(re)) {
    if (match.index === undefined) continue
    const openBrace = match.index + match[0].length - 1
    const close = findMatchingBrace(source, openBrace)
    if (close < 0) continue
    bodies.push(source.slice(openBrace + 1, close))
  }
  return bodies
}

function parseZodObjectProperties(
  objectBody: string,
): Record<string, OpenApiSchema> {
  const properties: Record<string, OpenApiSchema> = {}
  const re =
    /([A-Za-z_]\w*)\s*:\s*z\.(\w+)(?:\(([^)]*)\))?((?:\s*\.\s*\w+(?:\([^)]*\))?)*)/g
  for (const match of objectBody.matchAll(re)) {
    const [, name, zodType, arg, chain = ''] = match
    properties[name] = zodTypeToSchema(zodType, arg, chain)
  }
  return properties
}

function parseTypeAssertionProperties(
  objectBody: string,
): Record<string, OpenApiSchema> {
  const properties: Record<string, OpenApiSchema> = {}
  const re = /([A-Za-z_]\w*)\s*(\?)?\s*:\s*([^;\n]+)/g
  for (const match of objectBody.matchAll(re)) {
    properties[match[1]] = tsTypeToSchema(match[3].trim())
  }
  return properties
}
