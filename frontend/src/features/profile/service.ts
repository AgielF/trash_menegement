import { db } from '@/shared/db/db'

/**
 * Logika keluar akun (aturan playbook: jangan logout saat outbox masih berisi
 * data belum terkirim; data warga dibersihkan bila aman).
 */

/** Jumlah item outbox yang belum/salah kirim (dipakai peringatan logout). */
export async function countPendingOutbox(): Promise<number> {
  return db.outbox.where('status').anyOf(['pending', 'sending', 'failed']).count()
}

/**
 * Bersihkan data pribadi yang ter-cache di Dexie (data warga = data pribadi:
 * simpan seminimal mungkin). Outbox TIDAK dihapus — item gagal menunggu
 * tinjauan manusia dan bisa diperiksa setelah login kembali.
 */
export async function clearUserDataCache(): Promise<void> {
  await Promise.all([
    db.houses.clear(),
    db.pickups.clear(),
    db.payments.clear(),
    db.sessions.clear(),
    db.meta.clear(),
  ])
}
