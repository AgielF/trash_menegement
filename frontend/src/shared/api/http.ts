import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { env } from '@/config/env'

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string | null
  constructor(message: string, status: number | null, code: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface HttpHooks {
  getToken: () => string | null
  onUnauthorized: () => void
  /** Request auth (login/register) tidak memicu onUnauthorized. */
  isAuthRequest: (url: string) => boolean
}

let hooks: HttpHooks = {
  getToken: () => null,
  onUnauthorized: () => undefined,
  isAuthRequest: () => false,
}

/** Dipanggil sekali di app/ untuk menyambungkan store auth tanpa impor melingkar. */
export function configureHttp(next: HttpHooks): void {
  hooks = next
}

export const http = axios.create({ baseURL: env.VITE_API_URL, timeout: 15_000 })

http.interceptors.request.use((config) => {
  const token = hooks.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return Promise.reject(
      error instanceof Error ? error : new Error('Permintaan gagal.', { cause: error }),
    )
  }
  const status = error.response?.status ?? null
  if (status === 401 && !hooks.isAuthRequest(error.config?.url ?? '')) hooks.onUnauthorized()
  const data: unknown = error.response?.data
  const message =
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
      ? data.message
      : status === null
        ? 'Tidak dapat terhubung ke server.'
        : 'Permintaan gagal.'
  return Promise.reject(new ApiError(message, status, error.code ?? null))
})

/** Respons selalu divalidasi skema; ketidakcocokan kontrak langsung terdeteksi. */
export async function request<S extends z.ZodType>(
  config: AxiosRequestConfig,
  schema: S,
): Promise<z.infer<S>> {
  const response = await http.request<unknown>(config)
  return schema.parse(response.data)
}
