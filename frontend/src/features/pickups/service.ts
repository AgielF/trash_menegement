import { request } from '@/shared/api/http'
import { db, type PickupRow } from '@/shared/db/db'
import { enqueueOutbox } from '@/features/sync/service'
import { newId } from '@/shared/lib/id'
import { getTodayWib, toWibDateString } from '@/shared/lib/date'
import { startDayResponseSchema, statsResponseSchema, todayPickupSchema } from './schemas'
import type { StartDayResponse, StatsRange, StatsResponse, TodayPickup } from './schemas'

/** "Hari ini" menurut kalender WIB sebagai YYYY-MM-DD. */
export function todayKey(): string {
  return toWibDateString(getTodayWib())
}

/** Simpan respons "today" ke Dexie agar layar cukup dari database lokal. */
export async function cacheTodayRows(rows: readonly TodayPickup[]): Promise<void> {
  await db.pickups.bulkPut(rows)
}

/** POST /pickups/start-day — butuh koneksi karena aksi ini membuat record di server. */
export async function startDayOnline(): Promise<StartDayResponse> {
  const response = await request(
    { method: 'POST', url: '/pickups/start-day' },
    startDayResponseSchema,
  )
  await cacheTodayRows(response.houses)
  await db.sessions.put({
    collectorId: response.session.collectorId,
    sessionDate: response.session.sessionDate,
    status: 'in_progress',
    startedAt: response.session.startedAt,
    finishedAt: response.session.finishedAt,
  })
  return response
}

/** GET /pickups/today — kontrak resmi saat koneksi tersedia. */
export async function fetchToday(): Promise<readonly TodayPickup[]> {
  return request({ method: 'GET', url: '/pickups/today' }, todayPickupSchema.array())
}

/** GET /pickups/stats?range=... — sumber utama kartu Beranda (server, kalender WIB). */
export async function fetchStats(range: StatsRange): Promise<StatsResponse> {
  return request({ method: 'GET', url: '/pickups/stats', params: { range } }, statsResponseSchema)
}

/**
 * PATCH /pickups/:id/pickup — offline-first: tulis Dexie dulu, antre ke outbox;
 * runPush() mengirim PATCH fisik nanti (server validasi = sumber kebenaran).
 */
export async function recordPickup(record: PickupRow, bagsCount: number): Promise<PickupRow> {
  const nowIso = new Date().toISOString()
  const updated: PickupRow = {
    ...record,
    pickupStatus: 'sudah_diambil',
    pickedAt: nowIso,
    bagsCount,
    updatedAt: nowIso,
  }
  await db.pickups.put(updated)
  await enqueueOutbox({
    clientRef: newId(),
    method: 'PATCH',
    url: `/pickups/${record.id}/pickup`,
    body: { bagsCount },
  })
  return updated
}

/** POST /pickups/:id/skip — upsert per (recordId, skipDate): aman diulang ulang. */
export async function skipPickup(record: PickupRow, reason: string): Promise<PickupRow> {
  const today = todayKey()
  const skipId = newId()
  const nowIso = new Date().toISOString()
  const others = record.skips.filter((skip) => skip.skipDate !== today)
  const updated: PickupRow = {
    ...record,
    skips: [...others, { id: skipId, skipDate: today, reason }],
    updatedAt: nowIso,
  }
  await db.pickups.put(updated)
  await enqueueOutbox({
    clientRef: skipId,
    method: 'POST',
    url: `/pickups/${record.id}/skip`,
    body: { reason },
  })
  return updated
}

/**
 * Daftar "hari ini" ala /pickups/today, dihitung dari Dexie (offline-first):
 * belum_diambil ATAU sudah_diambil dengan pickedAt hari ini WIB; rumah aktif.
 */
export async function listTodayFromDb(): Promise<PickupRow[]> {
  const today = todayKey()
  const rows = await db.pickups.where('dueDate').belowOrEqual(today).toArray()
  return rows.filter(
    (row) =>
      row.pickupStatus === 'belum_diambil' ||
      (row.pickedAt !== null && toWibDateString(new Date(row.pickedAt)) === today),
  )
}

/** Ringkasan kartu Beranda (progres, Karung, Uang) — logika murni di atas data Dexie. */
export interface BerandaSnapshot {
  pickedToday: number
  remaining: number
  bagsToday: number
  moneyToday: number
  skippedToday: number
}

export async function gatherBeranda(): Promise<BerandaSnapshot> {
  const today = todayKey()
  const rows = await listTodayFromDb()
  let pickedToday = 0
  let remaining = 0
  let bagsToday = 0
  let skippedToday = 0
  for (const row of rows) {
    if (row.pickupStatus === 'sudah_diambil') {
      pickedToday += 1
      if (row.bagsCount !== null) bagsToday += row.bagsCount
    } else if (row.skips.some((skip) => skip.skipDate === today)) {
      skippedToday += 1
    }
    if (row.pickupStatus === 'belum_diambil') remaining += 1
  }
  // Kartu Uang: pembayaran aktif dengan paidAt hari WIB — dari Dexie (offline-first).
  const payments = await db.payments.toArray()
  const moneyToday = payments
    .filter(
      (payment) => payment.voidedAt === null && toWibDateString(new Date(payment.paidAt)) === today,
    )
    .reduce((total, payment) => total + payment.amount, 0)
  return { pickedToday, remaining, bagsToday, moneyToday, skippedToday }
}
