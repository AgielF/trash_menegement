import { toWibDateString } from '@/shared/lib/date'
import type { PickupRow } from '@/shared/db/db'

/**
 * Fungsi murni agregasi keuangan (bisa dites) — tanpa akses Dexie/HTTP.
 * Sisa = feeAmount − Σ pembayaran aktif (voidedAt === null).
 */

export interface KasbonHouse {
  houseId: string
  ownerName: string
  rt: string
  gang: string
  sisaEstimate: number
  recordCount: number
}

export interface PaymentLite {
  recordId: string
  amount: number
  voidedAt: string | null
}

/** Rangkum kasbon per rumah dari catatan pengambilan + pembayaran lokal. */
export function summarizeKasbon(
  records: readonly PickupRow[],
  payments: readonly PaymentLite[],
): KasbonHouse[] {
  const paidByRecord = new Map<string, number>()
  for (const payment of payments) {
    if (payment.voidedAt === null) {
      paidByRecord.set(payment.recordId, (paidByRecord.get(payment.recordId) ?? 0) + payment.amount)
    }
  }
  const byHouse = new Map<string, KasbonHouse>()
  for (const record of records) {
    if (record.pickupStatus !== 'sudah_diambil') continue
    const paid = paidByRecord.get(record.id) ?? 0
    const sisa = Math.max(0, record.feeAmount - paid)
    if (sisa <= 0) continue
    const current = byHouse.get(record.houseId) ?? {
      houseId: record.houseId,
      ownerName: record.house.ownerName,
      rt: record.house.rt,
      gang: record.house.gang,
      sisaEstimate: 0,
      recordCount: 0,
    }
    current.sisaEstimate += sisa
    current.recordCount += 1
    byHouse.set(record.houseId, current)
  }
  return [...byHouse.values()].sort((a, b) => b.sisaEstimate - a.sisaEstimate)
}

/** Saring pembayaran aktif (tidak void) pada tanggal WIB tertentu ("YYYY-MM-DD"). */
export function activePaymentsOfDay<T extends { paidAt: string; voidedAt: string | null }>(
  payments: readonly T[],
  wibDate: string,
): T[] {
  return payments.filter(
    (payment) => payment.voidedAt === null && toWibDateString(new Date(payment.paidAt)) === wibDate,
  )
}
