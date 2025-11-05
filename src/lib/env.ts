import { z } from 'zod'

/**
 * Environment variable schema
 * Add your required environment variables here
 */
const envSchema = z.object({
  // App configuration
  VITE_APP_NAME: z.string().default('Mindthos V2'),

  // API endpoints (add as needed)
  // VITE_API_URL: z.string().url(),

  // Feature flags (add as needed)
  // VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === 'true'),

  // Development mode detection
  DEV: z.boolean(),
  MODE: z.enum(['development', 'production', 'test']),
  PROD: z.boolean(),
})

/**
 * Validates environment variables at startup
 * Throws helpful errors if required variables are missing
 */
function validateEnv() {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.')
        return `  - ${path}: ${err.message}`
      })

      console.error('❌ Environment validation failed:')
      console.error(missingVars.join('\n'))
      console.error('\nPlease check your .env file and ensure all required variables are set.')

      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

/**
 * Validated and type-safe environment variables
 * Usage: import { env } from '@/lib/env'
 */
export const env = validateEnv()

/**
 * Type for environment variables
 */
export type Env = z.infer<typeof envSchema>
