import { z } from 'zod'

/**
 * Skema runtime kontrak /sync/pull — persis docs/recon-backend.md.
 * Tanggal bisnis tiba sebagai ISO string; dipakai apa adanya di Dexie.
 */

export const syncHouseSchema = z.object({
  id: z.string().min(1),
  ownerName: z.string(),
  rt: z.string(),
  gang: z.string(),
  addressNote: z.string().nullable(),
  collectorId: z.string().min(1),
  defaultFee: z.number().int().min(0),
  nextDueDate: z.string().nullable(),
  intervalDays: z.number().int().min(1),
  isActive: z.boolean(),
  deletedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
})

export const syncSkipSchema = z.object({
  id: z.string().min(1),
  recordId: z.string().min(1),
  skipDate: z.string(),
  reason: z.string(),
})

export const syncPickupSchema = z.object({
  id: z.string().min(1),
  houseId: z.string().min(1),
  collectorId: z.string().min(1),
  dueDate: z.string(),
  pickupStatus: z.enum(['belum_diambil', 'sudah_diambil']),
  pickedAt: z.string().nullable(),
  bagsCount: z.number().int().min(0).nullable(),
  feeAmount: z.number().int().min(0),
  paymentStatus: z.enum(['belum_bayar', 'sebagian', 'lunas']),
  house: z.object({
    id: z.string().min(1),
    ownerName: z.string(),
    rt: z.string(),
    gang: z.string(),
    addressNote: z.string().nullable(),
  }),
  skips: z.array(syncSkipSchema),
  createdAt: z.string(),
  updatedAt: z.string().min(1),
})

export const syncSettingSchema = z.object({ key: z.string(), value: z.string() })

export const pullResponseSchema = z.object({
  since: z.string().nullable(),
  serverTime: z.string(),
  houses: z.array(syncHouseSchema),
  pickups: z.array(syncPickupSchema),
  settings: z.array(syncSettingSchema),
})

export type SyncHouse = z.infer<typeof syncHouseSchema>
export type SyncPickup = z.infer<typeof syncPickupSchema>
export type PullResponse = z.infer<typeof pullResponseSchema>
