import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ALIAS_PREFIX = '@/'
const SRC_ROOT = () => path.join(process.cwd(), 'src')

/**
 * Resolve `@/foo/bar` import string to an absolute `.ts` path when it exists.
 */
function resolveAliasImport(specifier: string): string | null {
  if (!specifier.startsWith(ALIAS_PREFIX)) return null
  const relative = specifier.slice(ALIAS_PREFIX.length)
  const base = path.join(SRC_ROOT(), relative)
  if (base.endsWith('.ts') || base.endsWith('.tsx')) return base
  return `${base}.ts`
}

/**
 * Collect exported bindings imported from `@/` modules in a route/handler file.
 */
function parseAliasImports(
  source: string,
): Map<string, string /* absolute path */> {
  const map = new Map<string, string>()
  const re =
    /import\s+(?:type\s+)?(?:([\w$]+)|\{([^}]+)\})\s+from\s+['"](@\/[^'"]+)['"]/g
  for (const match of source.matchAll(re)) {
    const defaultImport = match[1]
    const named = match[2]
    const specifier = match[3]
    const resolved = resolveAliasImport(specifier)
    if (!resolved) continue
    if (defaultImport) map.set(defaultImport, resolved)
    if (named) {
      for (const part of named.split(',')) {
        const cleaned = part.trim()
        if (!cleaned || cleaned.startsWith('type ')) continue
        const [imported, local] = cleaned.split(/\s+as\s+/)
        const name = (local ?? imported).trim()
        if (name) map.set(name, resolved)
      }
    }
  }
  return map
}

/**
 * Map HTTP methods in a route file to the first handler callee symbol.
 */
export function mapHandlersToSymbols(
  source: string,
): Map<string /* GET */, string /* handleFoo */> {
  const map = new Map<string, string>()
  const re =
    /\b(GET|POST|PUT|PATCH|DELETE)\s*:\s*(?:async\s*)?(?:\([^)]*\)\s*=>\s*)?([A-Za-z_$][\w$]*)/g
  for (const match of source.matchAll(re)) {
    map.set(match[1].toUpperCase(), match[2])
  }
  return map
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

/**
 * Load the handler module for `symbol` and one hop of its `@/` imports
 * (schemas / parse helpers), returning concatenated source for param mining.
 */
export async function loadHandlerBundleSource(
  routeSource: string,
  handlerSymbol: string,
): Promise<string> {
  const routeImports = parseAliasImports(routeSource)
  const handlerPath = routeImports.get(handlerSymbol)
  if (!handlerPath) return ''

  const chunks: string[] = []
  const handlerSource = await readIfExists(handlerPath)
  if (!handlerSource) return ''
  chunks.push(handlerSource)

  const nested = parseAliasImports(handlerSource)
  for (const nestedPath of new Set(nested.values())) {
    // Skip test files and non-TS if somehow present.
    if (nestedPath.includes('.test.')) continue
    const nestedSource = await readIfExists(nestedPath)
    if (nestedSource) chunks.push(nestedSource)
  }

  return chunks.join('\n')
}
