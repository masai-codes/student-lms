import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { fromIni } from '@aws-sdk/credential-providers'
import dotenv from 'dotenv'

let secretsPromise: Promise<void> | null = null

function isLocalEnvironment() {
  return process.env.NODE_ENV === 'development'
}

function getAwsRegion() {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

function createSsmClient() {
  const region = getAwsRegion()
  const profile = process.env.AWS_PROFILE?.trim()

  if (isLocalEnvironment() && profile) {
    return new SSMClient({
      region,
      credentials: fromIni({ profile }),
    })
  }

  return new SSMClient({ region })
}

function loadLocalSecrets() {
  const result = dotenv.config()

  if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw result.error
  }
}

async function loadSecrets() {
  if (isLocalEnvironment()) {
    loadLocalSecrets()
  }

  const paramName = import.meta.env.VITE_SSM_AWS_SECRET_NAME

  if (!paramName) {
    throw new Error('SSM_AWS_SECRET_NAME env var is not set')
  }

  const command = new GetParameterCommand({
    Name: paramName,
    WithDecryption: true,
  })

  const ssmClient = createSsmClient()
  const response = await ssmClient.send(command)

  const secrets = JSON.parse(response.Parameter?.Value || '{}')
  console.log('[SSM] Loaded secrets:', secrets)

  for (const key in secrets) {
    process.env[key] = secrets[key]
  }
}


export async function ensureSecrets() {
  if (!secretsPromise) {
    secretsPromise = loadSecrets()
  }
  await secretsPromise
}