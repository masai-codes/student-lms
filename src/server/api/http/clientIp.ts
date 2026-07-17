/** Best-effort client IP from proxy headers, for the agreement's legal record. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? ''
  return request.headers.get('x-real-ip')?.trim() ?? ''
}
