import { randomUUID } from 'node:crypto'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ApiError } from '@/server/api/http/apiError'
import type { S3UploadScope } from '@/lib/api/uploads/s3UploadScope'

/** Region used for the S3 client; mirrors the SES setup's default. */
function getAwsRegion(): string {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

/** Key prefix (folder) uploads land under; configurable per environment. */
function getUploadPrefix(): string {
  return (
    process.env.AWS_S3_UPLOAD_PREFIX?.trim() || 'dev/lms/masaiverse'
  ).replace(/\/+$/, '')
}

/** Shared LMS root, e.g. `dev/lms` derived from `dev/lms/masaiverse`. */
function getLmsUploadRoot(): string {
  const prefix = getUploadPrefix()
  const lastSlash = prefix.lastIndexOf('/')
  return lastSlash > 0 ? prefix.slice(0, lastSlash) : prefix
}

/** Resolve a logical upload scope to an S3 key prefix. */
function resolveS3UploadScope(scope: S3UploadScope): string {
  switch (scope) {
    case 'tickets':
      return `${getLmsUploadRoot()}/tickets`
    case 'masaiverse':
    default:
      return getUploadPrefix()
  }
}

/** Max direct-upload size (10 MB), shared by presigned POST and multipart handlers. */
const S3_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

let cachedClient: S3Client | null = null
function getClient(): S3Client {
  // Credentials come from the default provider chain (AWS_ACCESS_KEY_ID /
  // AWS_SECRET_ACCESS_KEY in env), same as the SES client.
  cachedClient ??= new S3Client({ region: getAwsRegion() })
  return cachedClient
}

export interface UploadImageInput {
  buffer: Buffer
  contentType: string
  /** File extension without the dot, e.g. "png". */
  ext: string
  /** Override the S3 key prefix. Defaults to the env-configured upload prefix. */
  keyPrefix?: string
}

/**
 * Uploads a buffer to S3 under a random key and returns its public URL.
 * Pass `keyPrefix` to override the default folder (e.g. `dev/lms/tickets/{uuid}`).
 */
export async function uploadImageToS3({
  buffer,
  contentType,
  ext,
  keyPrefix,
}: UploadImageInput): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim()
  if (!bucket) throw new ApiError(500, 'S3_NOT_CONFIGURED')

  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const prefix = keyPrefix ?? getUploadPrefix()
  const key = `${prefix}/${randomUUID()}.${safeExt}`

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )

  return `https://${bucket}.s3.amazonaws.com/${key}`
}

export interface PresignedPostPolicyResult {
  url: string
  bucketPath: string
  fields: Record<string, string>
}

function fileExtensionFromName(fileName: string, contentType: string): string {
  if (fileName.includes('.')) {
    return (
      fileName
        .split('.')
        .pop()!
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'bin'
    )
  }
  return contentType.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin'
}

function buildScopedObjectKey(
  scope: S3UploadScope,
  fileName: string,
  contentType: string,
): string {
  const prefix = resolveS3UploadScope(scope)
  const folderId = randomUUID()
  const ext = fileExtensionFromName(fileName, contentType)
  const objectName = `${randomUUID().replace(/-/g, '').slice(0, 16)}.${ext}`
  return `${prefix}/${folderId}/${objectName}`
}

/**
 * Generates a presigned POST policy so the client can upload directly to S3.
 * Objects are stored under the scope folder, e.g. `dev/lms/tickets/<uuid>/<file>`.
 */
export async function generatePresignedPostPolicy(input: {
  scope: S3UploadScope
  fileName: string
  contentType: string
}): Promise<PresignedPostPolicyResult> {
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim()
  if (!bucket) throw new ApiError(500, 'S3_NOT_CONFIGURED')

  const contentType = input.contentType || 'application/octet-stream'
  const bucketPath = buildScopedObjectKey(
    input.scope,
    input.fileName,
    contentType,
  )

  const { url, fields } = await createPresignedPost(getClient(), {
    Bucket: bucket,
    Key: bucketPath,
    Conditions: [
      ['content-length-range', 0, S3_UPLOAD_MAX_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: {
      acl: 'public-read',
      'Content-Type': contentType,
    },
    Expires: 300,
  })

  return { url, bucketPath, fields }
}

interface PresignedUploadResult {
  uploadUrl: string
  s3Url: string
  key: string
}

/**
 * Generates a presigned PUT URL for the client to upload directly to S3.
 * The file lands under lms/dev/tickets/<uuid>.<ext>.
 * Expires in 5 minutes.
 */
async function generatePresignedUploadUrl(
  ext: string,
  contentType: string,
): Promise<PresignedUploadResult> {
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim()
  if (!bucket) throw new ApiError(500, 'S3_NOT_CONFIGURED')

  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const key = `lms/dev/tickets/${randomUUID()}.${safeExt}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 })
  const s3Url = `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`

  return { uploadUrl, s3Url, key }
}

/**
 * Generates a presigned GET URL for reading a private S3 object (e.g. a certificate PDF).
 * Expires in 1 hour by default.
 */
async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const bucket = (
    process.env.AWS_S3_CERTIFICATE_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
  )?.trim()
  if (!bucket) throw new ApiError(500, 'S3_NOT_CONFIGURED')

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(getClient(), command, { expiresIn })
}

/**
 * Generates a presigned PUT URL for uploading a merged legal-agreement PDF.
 * Key: legal-agreement/{userId}/{sectionId}/TC-{userId}-section_{sectionId}_{timestamp}.pdf
 * Expires in 10 minutes.
 */
async function generateLegalAgreementPresignedUrl(
  userId: number,
  sectionId: number,
  timestamp: number,
): Promise<PresignedUploadResult> {
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim()
  if (!bucket) throw new ApiError(500, 'S3_NOT_CONFIGURED')

  const referenceNumber = `TC-${userId}-section_${sectionId}`
  const key = `legal-agreement/${userId}/${sectionId}/${referenceNumber}_${timestamp}.pdf`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'application/pdf',
  })

  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 600 })
  const s3Url = `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`

  return { uploadUrl, s3Url, key }
}
