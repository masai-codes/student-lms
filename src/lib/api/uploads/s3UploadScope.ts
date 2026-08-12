/** S3 key prefixes exposed to the client presign API. */
export const S3_UPLOAD_SCOPES = ['tickets', 'masaiverse'] as const

export type S3UploadScope = (typeof S3_UPLOAD_SCOPES)[number]

function isS3UploadScope(value: string): value is S3UploadScope {
  return (S3_UPLOAD_SCOPES as ReadonlyArray<string>).includes(value)
}
