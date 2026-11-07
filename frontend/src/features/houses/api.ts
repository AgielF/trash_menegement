import { z } from 'zod'
import { request } from '@/shared/api/http'
import { invalidateCache } from '@/shared/api/requestCache'

const createdHouseSchema = z.object({
  id: z.string().min(1),
  ownerName: z.string(),
})

export interface CreateHouseBody {
  ownerName: string
  rt: string
  gang: string
  addressNote?: string
  defaultFee: number
  intervalDays: number
  nextDueDate: string
  collectorId?: string
}

/** POST /houses — collectors own their houses; admins assign an approved collector. */
export async function createHouse(body: CreateHouseBody): Promise<void> {
  await request({ method: 'POST', url: '/houses', data: body }, createdHouseSchema)
  invalidateCache('/admin/houses')
  invalidateCache('/houses')
}

export async function updateHouse(id: string, body: CreateHouseBody): Promise<void> {
  await request({ method: 'PATCH', url: `/houses/${id}`, data: body }, createdHouseSchema)
  invalidateCache('/admin/houses')
  invalidateCache('/houses')
}

export async function deleteHouse(id: string): Promise<void> {
  await request({ method: 'DELETE', url: `/houses/${id}` }, createdHouseSchema)
  invalidateCache('/admin/houses')
  invalidateCache('/houses')
}
