import { resolve } from 'node:path'
import { config } from 'dotenv'

// Load .env file bundled into the compute directory at build time.
// This is needed for AWS Amplify hosting where environment variables set
// in the Amplify console are only available during the build phase and
// must be written to a .env file to be accessible at Lambda runtime.
config({ path: resolve(process.cwd(), '.env') })
