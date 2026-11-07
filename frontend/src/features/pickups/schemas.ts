import { z } from 'zod'

/**
 * Kontrak /pickups/* persis docs/recon-backend.md (ambas versi REST):
 * - GET /pickups/today → array PickupRecord + house + skips hari ini WIB
 * - POST /pickups/start-day → { session, houses: <bentuk GET /pickups/today> }
 * - PATCH /pickups/:id/pickup → PickupRecord (bagsCount int ≥0)
 * - POST /pickups/:id/skip → PickupSkip (reason wajib)
 */

export const pickupSkipSchema = z.object({
  id: z.string().min(1),
  recordId: z.string().min(1),
  skipDate: z.string(),
  reason: z.string(),
})

export const todayHouseBriefSchema = z.object({
  id: z.string().min(1),
  ownerName: z.string(),
  rt: z.string(),
  gang: z.string(),
  addressNote: z.string().nullable(),
})

export const todayPickupSchema = z.object({
  id: z.string().min(1),
  houseId: z.string().min(1),
  collectorId: z.string().min(1),
  dueDate: z.string(),
  pickupStatus: z.enum(['belum_diambil', 'sudah_diambil']),
  pickedAt: z.string().nullable(),
  bagsCount: z.number().int().min(0).nullable(),
  feeAmount: z.number().int().min(0),
  paymentStatus: z.enum(['belum_bayar', 'sebagian', 'lunas']),
  house: todayHouseBriefSchema,
  skips: z.array(pickupSkipSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const collectionSessionSchema = z.object({
  id: z.string().min(1),
  collectorId: z.string().min(1),
  sessionDate: z.string(),
  status: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
})

export const startDayResponseSchema = z.object({
  session: collectionSessionSchema,
  houses: z.array(todayPickupSchema),
})

export const recordPickupResponseSchema = todayPickupSchema
export const skipResponseSchema = pickupSkipSchema

export const statsQuerySchema = z.enum(['today', 'week', 'month'])

export const statsResponseSchema = z.object({
  range: statsQuerySchema,
  totalCollected: z.number().int().min(0),
  pending: z.number().int().min(0),
  progress: z.number().min(0),
  totalBags: z.number().int().min(0),
  totalMoney: z.number().int().min(0),
})

export type TodayPickup = z.infer<typeof todayPickupSchema>
export type StartDayResponse = z.infer<typeof startDayResponseSchema>
export type StatsResponse = z.infer<typeof statsResponseSchema>
export type StatsRange = 'today' | 'week' | 'month'
