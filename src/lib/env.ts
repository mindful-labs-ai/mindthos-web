import { z } from 'zod';

/**
 * 환경 변수 스키마 및 검증
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
});

function validateEnv() {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      console.error('❌ Environment validation failed:');
      console.error(missingVars.join('\n'));
      console.error(
        '\nPlease check your .env file and ensure all required variables are set.'
      );

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
