import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  extractQueryParams,
  extractRequestBody,
  type ScannedQueryParam,
  type ScannedRequestBody,
} from '@/server/api/docs/extractOperationParams'
import {
  loadHandlerBundleSource,
  mapHandlersToSymbols,
} from '@/server/api/docs/resolveHandlerSources'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type ScannedMethodDetails = {
  queryParams: ScannedQueryParam[]
  requestBody: ScannedRequestBody | null
}

export type ScannedApiRoute = {
  /** OpenAPI path, e.g. `/api/learn/lectures/{lectureId}` */
  path: string
  methods: HttpMethod[]
  /** Per-method query/body inventory mined from handlers */
  methodDetails: Partial<Record<HttpMethod, ScannedMethodDetails>>
  /** Source file relative to cwd, for debugging */
  sourceFile: string
}

const CREATE_ROUTE_RE = /createFileRoute\(\s*['"`](\/api\/[^'"`]+)['"`]\s*\)/g

const HANDLER_METHOD_RE =
  /\b(GET|POST|PUT|PATCH|DELETE)\s*:\s*(?:async\s*)?(?:\(|\{)/g

const DOCS_PATH_PREFIX = '/api/docs'

/**
 * Convert TanStack `$lectureId` segments to OpenAPI `{lectureId}`.
 */
export function toOpenApiPath(tanstackPath: string): string {
  return tanstackPath.replace(/\$([A-Za-z_][\w]*)/g, '{$1}')
}

export function tagFromApiPath(openapiPath: string): string {
  const parts = openapiPath.split('/').filter(Boolean)
  return parts[1] ?? 'api'
}

export function extractPathParams(openapiPath: string): string[] {
  const names: string[] = []
  for (const match of openapiPath.matchAll(/\{([A-Za-z_][\w]*)\}/g)) {
    names.push(match[1])
  }
  return names
}

export type ParseApiRouteOptions = {
  /** Optional loader used by tests to inject handler sources. */
  loadBundle?: (handlerSymbol: string) => Promise<string>
}

/**
 * Parse a single route file's source for OpenAPI inventory fields.
 */
export async function parseApiRouteSource(
  source: string,
  sourceFile: string,
  options: ParseApiRouteOptions = {},
): Promise<ScannedApiRoute | null> {
  CREATE_ROUTE_RE.lastIndex = 0
  const routeMatch = CREATE_ROUTE_RE.exec(source)
  if (!routeMatch) return null

  const tanstackPath = routeMatch[1]
  if (
    tanstackPath === DOCS_PATH_PREFIX ||
    tanstackPath.startsWith(`${DOCS_PATH_PREFIX}/`)
  ) {
    return null
  }

  const methods = new Set<HttpMethod>()
  HANDLER_METHOD_RE.lastIndex = 0
  for (const match of source.matchAll(HANDLER_METHOD_RE)) {
    methods.add(match[1].toLowerCase() as HttpMethod)
  }
  if (methods.size === 0) return null

  const symbolByMethod = mapHandlersToSymbols(source)
  const methodDetails: ScannedApiRoute['methodDetails'] = {}

  for (const method of methods) {
    const symbol = symbolByMethod.get(method.toUpperCase())
    let bundle = ''
    if (symbol) {
      bundle = options.loadBundle
        ? await options.loadBundle(symbol)
        : await loadHandlerBundleSource(source, symbol)
    }
    methodDetails[method] = {
      queryParams: extractQueryParams(bundle),
      // Never mine a JSON body for GET — shared modules often define sibling
      // POST Zod schemas that would pollute the inventory.
      requestBody: method === 'get' ? null : extractRequestBody(bundle),
    }
  }

  return {
    path: toOpenApiPath(tanstackPath),
    methods: [...methods].sort(),
    methodDetails,
    sourceFile,
  }
}

async function walkTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkTsFiles(full)))
      continue
    }
    if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.test.ts')
    ) {
      files.push(full)
    }
  }
  return files
}

/**
 * Scan every TypeScript file under `src/routes/api` and return inventoried routes.
 */
export async function scanApiRoutes(
  routesApiDir = path.join(process.cwd(), 'src/routes/api'),
): Promise<ScannedApiRoute[]> {
  const files = await walkTsFiles(routesApiDir)
  const routes: ScannedApiRoute[] = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const relative = path.relative(process.cwd(), file)
    const parsed = await parseApiRouteSource(source, relative)
    if (parsed) routes.push(parsed)
  }

  routes.sort((a, b) => a.path.localeCompare(b.path))
  return routes
}
