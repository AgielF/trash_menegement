import { db, type PickupRow } from '@/shared/db/db'
import { getTodayWib, toWibDateString } from '@/shared/lib/date'
import { addPayment, type AddPaymentBody } from './api'
import { activePaymentsOfDay, summarizeKasbon, type KasbonHouse } from './aggregate'
import type { AddPaymentResponse } from './schemas'

export interface PaymentHistoryItem {
  id: string
  amount: number
  paidAt: string
  note: string | null
}

export interface LocalIncomeSummary {
  amount: number
  history: PaymentHistoryItem[]
}

/** Local-first Kasbon summary data access. */
export async function listKasbonHouses(): Promise<KasbonHouse[]> {
  const [pickups, payments] = await Promise.all([db.pickups.toArray(), db.payments.toArray()])
  return summarizeKasbon(pickups, payments)
}

export async function getKasbonHouse(
  houseId: string,
): Promise<{ ownerName: string; rt: string; gang: string } | null> {
  const house = await db.houses.get(houseId)
  return house === undefined ? null : { ownerName: house.ownerName, rt: house.rt, gang: house.gang }
}

export async function getPaymentHistory(houseId: string): Promise<PaymentHistoryItem[]> {
  const [payments, records] = await Promise.all([
    db.payments.toArray(),
    db.pickups.where('houseId').equals(houseId).toArray(),
  ])
  const recordIds = new Set(records.map((record) => record.id))
  return payments
    .filter((payment) => recordIds.has(payment.recordId) && payment.voidedAt === null)
    .map(({ id, amount, paidAt, note }) => ({ id, amount, paidAt, note }))
    .sort((left, right) => right.paidAt.localeCompare(left.paidAt))
}

export async function getLocalIncomeSummary(wibDate: string): Promise<LocalIncomeSummary> {
  const payments = activePaymentsOfDay(await db.payments.toArray(), wibDate)
  return {
    amount: payments.reduce((total, payment) => total + payment.amount, 0),
    history: payments.map(({ id, amount, paidAt, note }) => ({ id, amount, paidAt, note })),
  }
}

/** Store the server's accepted payment and updated record in Dexie. */
export async function cachePaymentResult(
  response: AddPaymentResponse,
  note: string | undefined,
): Promise<void> {
  const { payment, record } = response
  await db.payments.put({
    id: payment.id,
    recordId: payment.recordId,
    receivedBy: payment.receivedBy,
    amount: payment.amount,
    paidAt: payment.paidAt,
    note: note === '' ? null : (note ?? null),
    voidedAt: null,
    updatedAt: payment.updatedAt,
  })
  const local = await db.pickups.get(record.id)
  if (local !== undefined) {
    const updatedPickup: PickupRow = {
      ...local,
      paymentStatus: record.paymentStatus,
      updatedAt: record.updatedAt,
    }
    await db.pickups.put(updatedPickup)
  } else {
    await db.pickups.put({
      id: record.id,
      houseId: record.houseId,
      collectorId: record.collectorId,
      dueDate: record.dueDate,
      pickupStatus: record.pickupStatus,
      pickedAt: record.pickedAt,
      bagsCount: record.bagsCount,
      feeAmount: record.feeAmount,
      paymentStatus: record.paymentStatus,
      house: { id: record.houseId, ownerName: '', rt: '', gang: '', addressNote: null },
      skips: [],
      updatedAt: record.updatedAt,
    })
  }
}

/** POST payment and persist the accepted response in the local database. */
export async function savePayment(
  body: AddPaymentBody,
  note: string | undefined,
): Promise<AddPaymentResponse> {
  const response = await addPayment(body)
  await cachePaymentResult(response, note)
  return response
}

export function todayWibKey(): string {
  return toWibDateString(getTodayWib())
}
