import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm'

// SSM parameter names must match what you create in AWS Parameter Store.
// Convention: /amplify/<app-id>/<branch-name>/<secret-name>
// Set APP_SSM_PATH in Amplify environment variables (non-secret) to the
// parameter path prefix, e.g. "/amplify/myappid/main"
const SSM_PATH = process.env.APP_SSM_PATH

// Mapping of SSM parameter names (relative to SSM_PATH) to the
// NITRO_ env var names that Nitro's useRuntimeConfig reads.
const PARAM_MAP: Record<string, string> = {
  DATABASE_URL: 'NITRO_DATABASE_URL',
  JWT_SECRET_KEY: 'NITRO_JWT_SECRET_KEY',
  COOKIE_NAME: 'NITRO_COOKIE_NAME',
}

async function loadSecretsFromSSM() {
  if (!SSM_PATH) {
    // Not running on Amplify (local dev), skip SSM fetch.
    return
  }

  const client = new SSMClient({})

  const parameterNames = Object.keys(PARAM_MAP).map(
    (name) => `${SSM_PATH}/${name}`,
  )

  const command = new GetParametersCommand({
    Names: parameterNames,
    WithDecryption: true,
  })

  const response = await client.send(command)

  if (response.InvalidParameters && response.InvalidParameters.length > 0) {
    console.warn(
      '[SSM] The following parameters were not found in Parameter Store:',
      response.InvalidParameters,
    )
  }

  for (const param of response.Parameters ?? []) {
    const shortName = param.Name?.split('/').pop()
    if (!shortName) continue

    const envKey = PARAM_MAP[shortName]
    if (envKey && param.Value) {
      process.env[envKey] = param.Value
    }
  }
}

// Nitro requires a default export for server plugins.
// The plugin runs once at cold start before any requests are handled.
await loadSecretsFromSSM()
