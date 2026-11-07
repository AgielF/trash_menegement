import { describe, expect, it, vi, type MockInstance } from 'vitest'
import { z } from 'zod'
import { ApiError, http } from './http'
import {
  cachedGet,
  invalidateCache,
  isCoolingDown,
  isFresh,
  markRateLimited,
  resetRequestCache,
} from './requestCache'

const schema = z.object({ a: z.number() })
const T0 = 1_000_000

/** Hitung panggilan jaringan lewat spy di instance axios. */
function spyOnHttp(response: () => Promise<{ data: { a: number } }>): {
  spy: MockInstance
  calls: () => number
} {
  let count = 0
  const spy = vi.spyOn(http, 'request').mockImplementation(() => {
    count += 1
    return response()
  })
  return { spy, calls: () => count }
}

describe('lapisan cache GET (anti-429 throttler 10 req/menit)', () => {
  it('entri segar dipakai tanpa memanggil jaringan (dedupe antar-mount)', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.resolve({ data: { a: 1 } }))
    try {
      const first = await cachedGet({ url: '/x' }, schema, { now: () => T0 })
      const second = await cachedGet({ url: '/x' }, schema, { now: () => T0 })
      expect(second).toEqual(first)
      expect(calls()).toBe(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('entri kedaluwarsa (lewat TTL) memicu jaringan baru', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.resolve({ data: { a: 1 } }))
    try {
      await cachedGet({ url: '/y' }, schema, { now: () => T0 })
      await cachedGet({ url: '/y' }, schema, { now: () => T0 + 16_000 })
      expect(calls()).toBe(2)
    } finally {
      spy.mockRestore()
    }
  })

  it('params berbeda = cache berbeda', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.resolve({ data: { a: 1 } }))
    try {
      await cachedGet({ url: '/s', params: { range: 'today' } }, schema, { now: () => T0 })
      await cachedGet({ url: '/s', params: { range: 'week' } }, schema, { now: () => T0 })
      expect(calls()).toBe(2)
    } finally {
      spy.mockRestore()
    }
  })

  it('respons 429 memasang cooldown + tanpa data basi gagal cepat tanpa jaringan', async () => {
    resetRequestCache()
    const spy = vi
      .spyOn(http, 'request')
      .mockRejectedValue(new ApiError('Terlalu banyak permintaan', 429, null))
    try {
      await expect(cachedGet({ url: '/no-stale' }, schema, { now: () => T0 })).rejects.toThrow(
        'Terlalu banyak permintaan',
      )
      expect(isCoolingDown(T0 + 1)).toBe(true)
      await expect(cachedGet({ url: '/no-stale' }, schema, { now: () => T0 + 1 })).rejects.toThrow(
        'Server membatasi terlalu banyak permintaan',
      )
      // Hanya 1 panggilan asli; retry saat cooldown tidak menyentuh jaringan.
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('saat cooldown, data basi yang tersedia tetap dilayani (stale-while-cooldown)', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.resolve({ data: { a: 1 } }))
    try {
      await cachedGet({ url: '/staled' }, schema, { now: () => T0 })
      markRateLimited(T0 + 16_000)
      // Sudah lewat TTL, tapi masih cooldown → data basi, tanpa jaringan.
      const value = await cachedGet({ url: '/staled' }, schema, { now: () => T0 + 17_000 })
      expect(value).toEqual({ a: 1 })
      expect(calls()).toBe(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('setelah cooldown lewat, jaringan dipakai kembali', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.reject(new ApiError('gagal asli', 500, null)))
    // respons ditolak: CachedGet tidak boleh menyimpan kegagalan ke cache.
    try {
      await expect(cachedGet({ url: '/post' }, schema, { now: () => T0 })).rejects.toThrow(
        'gagal asli',
      )
      await expect(cachedGet({ url: '/post' }, schema, { now: () => T0 + 46_000 })).rejects.toThrow(
        'gagal asli',
      )
      expect(calls()).toBe(2)
    } finally {
      spy.mockRestore()
    }
  })

  it('invalidateCache(prefix) menghapus hanya entri terkait setelah mutasi', async () => {
    resetRequestCache()
    const { spy, calls } = spyOnHttp(() => Promise.resolve({ data: { a: 1 } }))
    try {
      await cachedGet({ url: '/pickups/today' }, schema, { now: () => T0 })
      await cachedGet({ url: '/pickups/stats', params: { range: 'today' } }, schema, {
        now: () => T0,
      })
      await cachedGet({ url: '/lain' }, schema, { now: () => T0 })
      invalidateCache('/pickups/')
      await cachedGet({ url: '/pickups/today' }, schema, { now: () => T0 })
      await cachedGet({ url: '/pickups/stats', params: { range: 'today' } }, schema, {
        now: () => T0,
      })
      await cachedGet({ url: '/lain' }, schema, { now: () => T0 }) // masih dari cache
      // urutan call: today, stats, lain, today (re), stats (re) → /lain tak re-fetch.
      expect(calls()).toBe(5)
    } finally {
      spy.mockRestore()
    }
  })

  it('isFresh patuh batas tepat TTL', () => {
    const entry = { value: 1, fetchedAt: 0 }
    expect(isFresh(entry, 15_000 - 1)).toBe(true)
    expect(isFresh(entry, 15_000)).toBe(false)
  })
})
