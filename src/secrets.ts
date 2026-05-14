import dotenv from 'dotenv'

let secretsPromise: Promise<void> | null = null

function isLocalEnvironment() {
  return process.env.NODE_ENV === 'development'
}

function getAwsRegion() {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

function getSsmParameterName() {
  return (
    process.env.VITE_SSM_AWS_SECRET_NAME?.trim() ||
    import.meta.env.VITE_SSM_AWS_SECRET_NAME?.trim() ||
    ''
  )
}

async function createSsmClient() {
  const { SSMClient } = await import('@aws-sdk/client-ssm')
  const region = getAwsRegion()
  const profile = process.env.AWS_PROFILE?.trim()

  if (isLocalEnvironment() && profile) {
    const { fromIni } = await import('@aws-sdk/credential-providers')
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

  const paramName = getSsmParameterName()

  // In local/dev, allow running with only .env values (no SSM required).
  if (!paramName) {
    return
  }

  // Load AWS SDK only when SSM is actually needed.
  const { GetParameterCommand } = await import('@aws-sdk/client-ssm')
  const command = new GetParameterCommand({
    Name: paramName,
    WithDecryption: true,
  })

  const ssmClient = await createSsmClient()
  const response = await ssmClient.send(command)

  const secrets = JSON.parse(response.Parameter?.Value || '{}')

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