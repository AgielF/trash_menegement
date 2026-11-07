import { z } from 'zod'

/**
 * Kontrak /payments/* dan /admin/* — persis payments.service.ts &
 * admin.service.ts backend (docs/recon-backend.md). DILARANG menebak field.
 */

/** Bentuk Payment Prisma (id/voidedAt/…) — append-only, koreksi lewat void. */
export const paymentFieldsSchema = z.object({
  id: z.string().min(1),
  recordId: z.string().min(1),
  receivedBy: z.string().min(1),
  /** rupiah bulat, ≥ 1 (server clamp ke sisa tagihan). */
  amount: z.number().int().min(1),
  paidAt: z.string().min(1),
  note: z.string().nullable(),
  voidedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
})

/** Record penuh tanpa relasi house/skips (yang direturn controller). */
export const paymentRecordSchema = z.object({
  id: z.string().min(1),
  houseId: z.string().min(1),
  collectorId: z.string().min(1),
  dueDate: z.string(),
  pickupStatus: z.enum(['belum_diambil', 'sudah_diambil']),
  pickedAt: z.string().nullable(),
  bagsCount: z.number().int().min(0).nullable(),
  feeAmount: z.number().int().min(0),
  paymentStatus: z.enum(['belum_bayar', 'sebagian', 'lunas']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** POST /payments → { payment(+requestedAmount, clamped), record, remaining, kasbonLimit }. */
export const addPaymentResponseSchema = z.object({
  payment: paymentFieldsSchema.extend({
    requestedAmount: z.number().int().min(1),
    clamped: z.boolean(),
  }),
  record: paymentRecordSchema,
  remaining: z.number().int().min(0),
  kasbonLimit: z.number().int().min(0).nullable(),
})

/** GET /payments/outstanding/:houseId → baris kasbon per record (sisa > 0). */
export const outstandingRowSchema = z.object({
  id: z.string().min(1),
  houseId: z.string().min(1),
  collectorId: z.string().min(1),
  dueDate: z.string(),
  pickedAt: z.string().nullable(),
  bagsCount: z.number().int().min(0).nullable(),
  feeAmount: z.number().int().min(0),
  paid: z.number().int().min(0),
  sisa: z.number().int().min(1),
  paymentStatus: z.enum(['belum_bayar', 'sebagian', 'lunas']),
})

// ---- Admin ----

export const pendingUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  email: z.string(),
  createdAt: z.string(),
  roles: z.array(z.object({ role: z.object({ name: z.string() }) })),
})

export const adminDecisionSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  email: z.string(),
  status: z.string(),
  approvedById: z.string().nullable(),
  approvedAt: z.string().nullable(),
})

export const adminSettingsSchema = z.object({
  kasbonLimit: z.number().int().min(0).nullable(),
  items: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      updatedBy: z.string(),
      updatedAt: z.string(),
    }),
  ),
})

export type PaymentFields = z.infer<typeof paymentFieldsSchema>
export type PaymentRecord = z.infer<typeof paymentRecordSchema>
export type AddPaymentResponse = z.infer<typeof addPaymentResponseSchema>
export type OutstandingRow = z.infer<typeof outstandingRowSchema>
export type PendingUser = z.infer<typeof pendingUserSchema>
export type AdminDecision = z.infer<typeof adminDecisionSchema>
export type AdminSettings = z.infer<typeof adminSettingsSchema>
