import { ApiError, http, request } from '@/shared/api/http'
import { db } from '@/shared/db/db'
import type { OutboxItem } from '@/shared/db/db'
import { pullResponseSchema } from './schemas'
import { create } from 'zustand'

/**
 * Sinkron offline-first:
 * - PULL: /sync/pull?lastSyncedAt=... → validasi skema → upsert ke Dexie
 *   (server menang bila `updatedAt` lokal tidak lebih baru).
 * - PUSH: kirim isi outbox (antrian REST) satu per satu; galat jaringan
 *   menghentikan proses tanpa membuang item; galat bisnis ditandai `failed`
 *   dan ditampilkan ke pengguna.
 */

interface SyncState {
  syncing: boolean
  lastError: string | null
  failedCount: number
  lastPulledAt: string | null
}

export const useSyncStore = create<SyncState>(() => ({
  syncing: false,
  lastError: null,
  failedCount: 0,
  lastPulledAt: null,
}))

function setSync(partial: Partial<SyncState>): void {
  useSyncStore.setState(partial)
}

const LAST_SYNC_KEY = 'lastSyncedAt'

export async function runPull(): Promise<void> {
  try {
    setSync({ lastError: null })
    const stored = await db.meta.get(LAST_SYNC_KEY)
    const response = await request(
      {
        method: 'GET',
        url: '/sync/pull',
        params: stored !== undefined ? { lastSyncedAt: stored.value } : undefined,
      },
      pullResponseSchema,
    )
    await db.transaction('rw', db.houses, db.pickups, db.meta, async () => {
      for (const house of response.houses) {
        const local = await db.houses.get(house.id)
        if (local === undefined || local.updatedAt <= house.updatedAt) {
          await db.houses.put(house)
        }
      }
      for (const pickup of response.pickups) {
        const local = await db.pickups.get(pickup.id)
        if (local === undefined || local.updatedAt <= pickup.updatedAt) {
          await db.pickups.put(pickup)
        }
      }
      if (response.since !== null) {
        // Jadikan watermark baru = serverTime agar perubahan berikutnya terserong.
        await db.meta.put({ key: LAST_SYNC_KEY, value: response.serverTime })
      }
    })
    setSync({ lastPulledAt: response.serverTime })
  } catch {
    // Catch galat sinkron secara diam: layar tetap menyaji data Dexie.
    setSync({ lastError: 'Sinkronisasi gagal — melanjutkan mode offline.' })
  }
}

/** Keluarkan satu item outbox; return true bila perlu berhenti (jaringan/gagal-tetap). */
async function flushOne(item: OutboxItem): Promise<boolean> {
  if (item.status === 'failed') {
    // Item gagal permanen menunggu tinjauan manusia, jangan diulang diam-diam.
    return true
  }
  try {
    await db.outbox.update(item.clientRef, { status: 'sending' })
    await http.request({ method: item.method, url: item.url, data: item.body })
    await db.outbox.delete(item.clientRef)
    return false // lanjut ke item berikutnya
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status !== null) {
      // Galat bisnis dari server: tandai permanen agar konflik terlihat pengguna.
      await db.outbox.update(item.clientRef, {
        status: 'failed',
        attempts: item.attempts + 1,
        lastError: error.message,
      })
      return false
    }
    // Jaringan bermasalah: berhenti di item ini, coba lagi nanti.
    return true
  }
}

export async function runPush(): Promise<void> {
  if (useSyncStore.getState().syncing) return
  setSync({ syncing: true, lastError: null })
  try {
    const items = await db.outbox.orderBy('createdAt').toArray()
    for (const item of items) {
      const shouldStop = await flushOne(item)
      if (shouldStop) break
    }
    const failed = await db.outbox.where('status').equals('failed').count()
    setSync({ failedCount: failed })
  } finally {
    setSync({ syncing: false })
  }
}

export async function enqueueOutbox(
  item: Omit<OutboxItem, 'createdAt' | 'attempts' | 'status'>,
): Promise<void> {
  await db.outbox.put({ ...item, createdAt: Date.now(), attempts: 0, status: 'pending' })
}

export async function refreshPendingCount(): Promise<number> {
  const count = await db.outbox.where('status').anyOf(['pending', 'sending', 'failed']).count()
  setSync({ failedCount: await db.outbox.where('status').equals('failed').count() })
  return count
}

/** Pemicu sinkron: app start, event online, dan interval saat aplikasi terbuka. */
export function startSyncTriggers(): () => void {
  void runPush().then(() => runPull())
  const onOnline = (): void => {
    void runPush().then(() => runPull())
  }
  window.addEventListener('online', onOnline)
  const interval = window.setInterval(() => {
    void runPush()
  }, 60_000)
  return () => {
    window.removeEventListener('online', onOnline)
    window.clearInterval(interval)
  }
}
