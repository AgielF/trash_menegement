import type { z } from 'zod'

/**
 * Penembolokan penyimpanan web terpusat.
 *
 * DILARANG memanggil localStorage/sessionStorage langsung di mana pun selain
 * file ini (diterapkan ESLint, playbook 3.4). Token token sesi disimpan di sini —
 * risiko diterima sementara (D1, playbook bagian 5).
 */

const KEYS = {
  authToken: 'bersihku.auth.token',
  user: 'bersihku.auth.user',
} as const
export type StorageKey = keyof typeof KEYS

function getStorage(): Storage {
  return window.localStorage
}

/**
 * Data dari storage adalah "data dari luar": wajib lewat skema. Ingat bahwa
 * token/user di D1 adalah risiko yang diterima sementara — tetap divalidasi.
 */
export function getItem<T extends z.ZodType>(key: StorageKey, schema: T): z.infer<T> | null {
  const raw = getStorage().getItem(KEYS[key])
  if (raw === null) return null
  try {
    return schema.parse(JSON.parse(raw))
  } catch {
    // Nilai rusak atau tak cocok skema: anggap tidak ada dan bersihkan agar tidak berulang.
    removeItem(key)
    return null
  }
}

export function setItem(key: StorageKey, value: unknown): void {
  getStorage().setItem(KEYS[key], JSON.stringify(value))
}

export function removeItem(key: StorageKey): void {
  getStorage().removeItem(KEYS[key])
}
