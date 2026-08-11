/**
 * API docs (Swagger UI + OpenAPI inventory) are disabled in production.
 */
export function isApiDocsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}
