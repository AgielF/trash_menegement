import Dexie, { type EntityTable } from 'dexie'

/**
 * Skema Dexie v1 — versi hanya boleh DITAMBAH, jangan diedit (playbook OFFLINE/PWA).
 * Nama field mengikuti kontrak /sync/pull nyata (docs/recon-backend.md).
 */

export interface HouseRow {
  id: string
  ownerName: string
  rt: string
  gang: string
  addressNote: string | null
  collectorId: string
  defaultFee: number
  /** "YYYY-MM-DD" atau null (belum berjadwal) — string ISO date, aman dibandingkan leksikal. */
  nextDueDate: string | null
  intervalDays: number
  isActive: boolean
  deletedAt: string | null
  updatedAt: string
}

export interface SkipRow {
  id: string
  skipDate: string
  reason: string
}

export interface PickupRow {
  id: string
  houseId: string
  collectorId: string
  dueDate: string
  pickupStatus: 'belum_diambil' | 'sudah_diambil'
  pickedAt: string | null
  bagsCount: number | null
  feeAmount: number
  paymentStatus: 'belum_bayar' | 'sebagian' | 'lunas'
  house: { id: string; ownerName: string; rt: string; gang: string; addressNote: string | null }
  skips: SkipRow[]
  updatedAt: string
}

export interface PaymentRow {
  id: string
  recordId: string
  receivedBy: string
  /** rupiah bulat, > 0 */
  amount: number
  paidAt: string
  note: string | null
  voidedAt: string | null
  updatedAt: string
}

export interface SessionRow {
  collectorId: string
  sessionDate: string
  status: 'not_started' | 'in_progress'
  startedAt: string | null
  finishedAt: string | null
}

/** Antrian panggilan REST yang belum terkirim (offline-first). */
export interface OutboxItem {
  /** UUID klien; idempotensi permintaan yang bisa ulang (skip = upsert server). */
  clientRef: string
  method: 'POST' | 'PATCH'
  url: string
  body?: unknown
  createdAt: number
  attempts: number
  status: 'pending' | 'sending' | 'failed'
  lastError?: string
}

export interface MetaRow {
  key: string
  value: string
}

class BersihkuDB extends Dexie {
  houses!: EntityTable<HouseRow, 'id'>
  pickups!: EntityTable<PickupRow, 'id'>
  payments!: EntityTable<PaymentRow, 'id'>
  sessions!: EntityTable<SessionRow, 'sessionDate'>
  outbox!: EntityTable<OutboxItem, 'clientRef'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor() {
    super('bersihku')
    this.version(1).stores({
      houses: 'id, collectorId, nextDueDate, isActive',
      pickups: 'id, houseId, dueDate, [houseId+dueDate]',
      payments: 'id, recordId, paidAt',
      sessions: '[collectorId+sessionDate]',
      outbox: 'clientRef, status, createdAt',
      meta: 'key',
    })
  }
}

export const db = new BersihkuDB()
