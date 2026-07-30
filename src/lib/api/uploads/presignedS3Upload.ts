import { fetchJson } from '@/lib/api/fetchJson'
import { UPLOAD_API } from '@/lib/api/uploads/uploadPaths'
import type { S3UploadScope } from '@/lib/api/uploads/s3UploadScope'

export type PresignedPostPolicy = {
  /** S3 POST endpoint, e.g. `https://coding-platform.s3.amazonaws.com`. */
  url: string
  /** Object key within the bucket, e.g. `dev/lms/tickets/<uuid>/<file>`. */
  bucketPath: string
  /** Form fields for the multipart POST (object or legacy JSON string). */
  fields: Record<string, string> | string
}

export type UploadedFileResult = {
  url: string
  name: string
}

function parsePresignedFields(
  fields: PresignedPostPolicy['fields'],
): Record<string, string> {
  return typeof fields === 'string'
    ? (JSON.parse(fields) as Record<string, string>)
    : fields
}

/** Build the public URL for an object uploaded via presigned POST. */
export function buildPublicS3Url(
  uploadUrl: string,
  bucketPath: string,
): string {
  return `${uploadUrl.replace(/\/$/, '')}/${bucketPath}`
}

/** Request a presigned POST policy from the LMS API. */
export async function requestPresignedPostPolicy(input: {
  fileName: string
  contentType: string
  scope: S3UploadScope
}): Promise<PresignedPostPolicy> {
  return fetchJson<PresignedPostPolicy>(UPLOAD_API.presign, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/**
 * Upload a browser `File` directly to S3 via presigned POST.
 * Returns the public object URL and the original file name.
 */
export async function uploadFileViaPresignedPost(
  file: File,
  options: { scope: S3UploadScope },
): Promise<UploadedFileResult> {
  const policy = await requestPresignedPostPolicy({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    scope: options.scope,
  })

  const fields = parsePresignedFields(policy.fields)
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value)
  }
  form.append('file', file)

  const uploadResponse = await fetch(policy.url, { method: 'POST', body: form })
  if (!uploadResponse.ok) {
    throw new Error('S3_UPLOAD_FAILED')
  }

  return {
    url: buildPublicS3Url(policy.url, policy.bucketPath),
    name: file.name,
  }
}
