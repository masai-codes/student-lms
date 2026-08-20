import { fromIni } from '@aws-sdk/credential-providers'

function isLocalEnvironment() {
  return process.env.NODE_ENV === 'development'
}

const DEFAULT_CERTIFICATE_TEMPLATES_S3_URI =
  's3://experience-api-production/certificates/'

function resolveCertificateS3Credentials() {
  if (!isLocalEnvironment()) return undefined
  const profile = process.env.AWS_PROFILE?.trim()
  if (profile) return fromIni({ profile })
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const sessionToken =
    process.env.S3_SESSION_TOKEN?.trim() ||
    process.env.AWS_SESSION_TOKEN?.trim()
  if (accessKeyId && secretAccessKey)
    return {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    }
  return undefined
}

export function resolveCertificateS3Config(): {
  certificateTemplatesS3Uri: string
  region: string
  credentials?: NonNullable<ReturnType<typeof resolveCertificateS3Credentials>>
} {
  const certificateTemplatesS3Uri =
    process.env.CERTIFICATE_TEMPLATES_S3_URI?.trim() ||
    process.env.S3_CERTIFICATE_TEMPLATES_URI?.trim() ||
    DEFAULT_CERTIFICATE_TEMPLATES_S3_URI
  const region =
    process.env.S3_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    'us-east-1'
  const credentials = resolveCertificateS3Credentials()
  return {
    certificateTemplatesS3Uri,
    region,
    ...(credentials !== undefined ? { credentials } : {}),
  }
}
