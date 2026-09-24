import { z } from 'zod'

// Centralized frontend env validation — single source of truth for all
// import.meta.env reads. Fails fast at dev boot / build with every issue
// listed, mirroring backend/src/config/env.ts.
const emptyToUndefined = (v: unknown) => {
  if (typeof v !== 'string') return v
  const trimmed = v.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

const frontEnvSchema = z.object({
  VITE_API_URL: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .url('VITE_API_URL must be a valid URL')
      .transform((s) => s.replace(/\/+$/, ''))
      .default('http://localhost:3000'),
  ),
})

const parsed = frontEnvSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid frontend environment: ${details}`)
}

export const env = parsed.data
export type FrontEnv = typeof env
