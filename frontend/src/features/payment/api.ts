import { z } from 'zod'
import { request } from '@/shared/api/http'
import { cachedGet, invalidateCache } from '@/shared/api/requestCache'
import {
  addPaymentResponseSchema,
  outstandingRowSchema,
  pendingUserSchema,
  adminDecisionSchema,
  adminSettingsSchema,
} from './schemas'
import type {
  AddPaymentResponse,
  AdminDecision,
  AdminSettings,
  OutstandingRow,
  PendingUser,
} from './schemas'

export interface AddPaymentBody {
  recordId: string
  /** rupiah bulat ≥ 1; server membatasi ke sisa (clamp). */
  amount: number
  note?: string
}

/** POST /payments — server mengunci baris record dan men-clamp jumlah ke sisa. */
export async function addPayment(body: AddPaymentBody): Promise<AddPaymentResponse> {
  const response = await request(
    { method: 'POST', url: '/payments', data: body },
    addPaymentResponseSchema,
  )
  // Buang cache outstanding agar detail kasbon memuat sisa terbaru.
  invalidateCache('/payments/')
  return response
}

/** GET /payments/outstanding/:houseId — kasbon rumah: hanya record dengan sisa > 0. */
export async function fetchOutstanding(houseId: string): Promise<readonly OutstandingRow[]> {
  return cachedGet(
    { method: 'GET', url: `/payments/outstanding/${houseId}` },
    outstandingRowSchema.array(),
  )
}

// ---- Admin (JWT + role admin; otorisasi di server/guard, bukan di UI) ----

/** GET /admin/pending — daftar user menunggu persetujuan (cache anti-429). */
export async function fetchPendingUsers(): Promise<readonly PendingUser[]> {
  return cachedGet({ method: 'GET', url: '/admin/pending' }, pendingUserSchema.array())
}

/** PATCH /admin/approve/:userId — respons User ringkas pasca-putuskan. */
export async function approveUser(userId: string): Promise<AdminDecision> {
  const response = await request(
    { method: 'PATCH', url: `/admin/approve/${userId}` },
    adminDecisionSchema,
  )
  invalidateCache('/admin/')
  return response
}

/** PATCH /admin/reject/:userId */
export async function rejectUser(userId: string): Promise<AdminDecision> {
  const response = await request(
    { method: 'PATCH', url: `/admin/reject/${userId}` },
    adminDecisionSchema,
  )
  invalidateCache('/admin/')
  return response
}

/** GET /admin/settings — termasuk batas kasbon global. */
export async function fetchAdminSettings(): Promise<AdminSettings> {
  return cachedGet({ method: 'GET', url: '/admin/settings' }, adminSettingsSchema)
}

/** PATCH /admin/settings/kasbon-limit — body { value } rupiah ≥ 0. */
export async function setKasbonLimit(value: number): Promise<{ key: string; value: string }> {
  const response = await request(
    { method: 'PATCH', url: '/admin/settings/kasbon-limit', data: { value } },
    z.object({ key: z.string(), value: z.string() }),
  )
  invalidateCache('/admin/')
  return response
}
