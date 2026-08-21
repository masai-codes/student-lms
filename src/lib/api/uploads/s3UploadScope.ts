/** S3 key prefixes exposed to the client presign API. */
export const S3_UPLOAD_SCOPES = ['tickets', 'masaiverse'] as const

export type S3UploadScope = (typeof S3_UPLOAD_SCOPES)[number]
