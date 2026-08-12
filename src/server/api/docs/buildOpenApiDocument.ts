import {
  extractPathParams,
  scanApiRoutes,
  tagFromApiPath,
  type ScannedApiRoute,
} from '@/server/api/docs/scanApiRoutes'

export type OpenApiDocument = {
  openapi: '3.0.3'
  info: { title: string; version: string; description: string }
  servers: Array<{ url: string; description: string }>
  tags: Array<{ name: string }>
  paths: Record<string, Record<string, unknown>>
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey'
        in: 'cookie'
        name: string
        description: string
      }
    }
  }
}

function operationFor(
  route: ScannedApiRoute,
  method: string,
): Record<string, unknown> {
  const tag = tagFromApiPath(route.path)
  const details =
    route.methodDetails[method as keyof typeof route.methodDetails]

  const parameters: Array<Record<string, unknown>> = extractPathParams(
    route.path,
  ).map((name) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))

  for (const query of details?.queryParams ?? []) {
    parameters.push({
      name: query.name,
      in: 'query',
      required: false,
      schema: query.schema,
    })
  }

  const operation: Record<string, unknown> = {
    tags: [tag],
    summary: `${method.toUpperCase()} ${route.path}`,
    operationId: `${method}_${route.path.replace(/[^\w]+/g, '_')}`.replace(
      /^_+|_+$/g,
      '',
    ),
    parameters: parameters.length > 0 ? parameters : undefined,
    responses: {
      '200': { description: 'Success (shape not inventoried)' },
      default: { description: 'Error (shape not inventoried)' },
    },
    security: [{ cookieAuth: [] }],
    'x-source-file': route.sourceFile,
  }

  // GET/HEAD must never advertise a body — browsers reject fetch with a body.
  // Shared handler files often contain sibling POST schemas that we would
  // otherwise mis-attribute to GET when mining the whole module.
  if (details?.requestBody && method !== 'get' && method !== 'head') {
    operation.requestBody = {
      required: details.requestBody.required,
      content: {
        'application/json': {
          schema: details.requestBody.schema,
        },
      },
    }
  }

  return operation
}

export function buildOpenApiDocumentFromRoutes(
  routes: ScannedApiRoute[],
): OpenApiDocument {
  const paths: OpenApiDocument['paths'] = {}
  const tagNames = new Set<string>()

  for (const route of routes) {
    tagNames.add(tagFromApiPath(route.path))
    const pathItem = paths[route.path] ?? {}
    for (const method of route.methods) {
      pathItem[method] = operationFor(route, method)
    }
    paths[route.path] = pathItem
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Student LMS API',
      version: '1.0.0',
      description:
        'Auto-inventory of `src/routes/api/**` (paths, methods, query params, and JSON bodies mined from handlers). Non-production.',
    },
    servers: [{ url: '/', description: 'Current origin' }],
    tags: [...tagNames].sort().map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name:
            process.env.COOKIE_NAME || process.env.NEW_COOKIE_NAME || 'session',
          description: 'LMS session cookie (COOKIE_NAME / NEW_COOKIE_NAME).',
        },
      },
    },
  }
}

export async function buildOpenApiDocument(): Promise<OpenApiDocument> {
  const routes = await scanApiRoutes()
  return buildOpenApiDocumentFromRoutes(routes)
}
