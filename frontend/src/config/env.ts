import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

const parsed = EnvSchema.safeParse(import.meta.env)
if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  throw new Error(`Konfigurasi lingkungan tidak valid: ${detail}`)
}

/** Hanya variabel VITE_ (publik). Jangan pernah menaruh rahasia di sini. */
export const env = parsed.data
