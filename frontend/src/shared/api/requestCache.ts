import type { AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { ApiError, request } from './http'

/**
 * Lapisan cache GET anti-throttle (bug 429 Too Many Requests):
 * backend membatasi 10 req/menit per IP, sedangkan halaman bisa di-mount
 * berulang (pindah tab, StrictMode dev). Kebijakan:
 * - Nilai segar (fetchedAt < TTL) dipakai tanpa jaringan.
 * - Permintaan paralel ke URL+params sama berbagi satu promise (dedupe).
 * - Respons 429 memasang COOLDOWN: selama itu semua GET dilayani data basi
 *   bila ada; bila tidak ada, gagal cepat (429) tanpa menabrak server lagi.
 * - invalidateCache dipanggil setelah mutasi (mis. start-day) agar daftar
 *   rumah memuat data baru.
 * Tidak ada dependensi baru (bukan React Query) — state modul + fungsi murni.
 */

const CACHE_TTL_MS = 15_000
const RATE_LIMIT_COOLDOWN_MS = 45_000

interface CacheEntry {
  value: unknown
  fetchedAt: number
}

const entries = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()
let cooldownUntil = 0

/** Buku kecil murni: entri masih segar bila usianya < TTL. */
export function isFresh(entry: CacheEntry, now: number, ttl = CACHE_TTL_MS): boolean {
  return now - entry.fetchedAt < ttl
}

/** Buku kecil murni: apakah sedang masa dingin pasca-429. */
export function isCoolingDown(now: number, until = cooldownUntil): boolean {
  return now < until
}

/** Setelah 429, tahan permintaan GET baru selama COOLDOWN. */
export function markRateLimited(now: number, cooldown = RATE_LIMIT_COOLDOWN_MS): number {
  cooldownUntil = now + cooldown
  return cooldownUntil
}

function cacheKey(url: string, params: unknown): string {
  return url === '' ? '' : `${url}?${JSON.stringify(params ?? null)}`
}

/** Hapus cache bila URL diawali prefix (dipakai setelah mutasi, mis. start-day). */
export function invalidateCache(urlPrefix: string): void {
  for (const key of entries.keys()) {
    if (key.startsWith(urlPrefix)) entries.delete(key)
  }
}

/** Reset penuh — hanya untuk test. */
export function resetRequestCache(): void {
  entries.clear()
  inFlight.clear()
  cooldownUntil = 0
}

interface CachedGetOptions {
  /** Injeksi jam agar bisa dites deterministik. */
  now?: () => number
}

/** GET lewat cache: sama kontrak dengan request() = zod-divalidasi. */
export async function cachedGet<S extends z.ZodType>(
  config: AxiosRequestConfig & { url: string },
  schema: S,
  options: CachedGetOptions = {},
): Promise<z.infer<S>> {
  const now = options.now ?? (() => Date.now())
  const key = cacheKey(config.url, config.params)

  if (key === '') {
    return request({ ...config, method: 'GET' }, schema)
  }

  // Masa dingin pasca-429: layani data basi bila ada, bila tidak gagal cepat.
  if (isCoolingDown(now())) {
    const stale = entries.get(key)
    if (stale !== undefined) return stale.value as z.infer<S>
    throw new ApiError(
      'Server membatasi terlalu banyak permintaan. Coba lagi beberapa saat.',
      429,
      'RATE_COOLDOWN',
    )
  }

  const cached = entries.get(key)
  if (cached !== undefined && isFresh(cached, now())) {
    return cached.value as z.infer<S>
  }

  const flight = inFlight.get(key)
  if (flight !== undefined) {
    return flight as Promise<z.infer<S>>
  }

  const fresh = request({ ...config, method: 'GET' }, schema).then(
    (value) => {
      inFlight.delete(key)
      entries.set(key, { value, fetchedAt: now() })
      return value
    },
    (error: unknown) => {
      inFlight.delete(key)
      if (error instanceof ApiError && error.status === 429) markRateLimited(now())
      throw error
    },
  )
  inFlight.set(key, fresh)
  return fresh
}
