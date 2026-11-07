import { z } from 'zod'
import { http, request } from '@/shared/api/http'
import { cachedGet } from '@/shared/api/requestCache'

export const adminHouseSchema = z.object({
  id: z.string().min(1),
  ownerName: z.string(),
  rt: z.string(),
  gang: z.string(),
  addressNote: z.string().nullable(),
  defaultFee: z.number().int(),
  nextDueDate: z.string().nullable(),
  intervalDays: z.number().int(),
  isActive: z.boolean(),
  deletedAt: z.string().nullable(),
  collector: z.object({
    id: z.string().min(1),
    fullName: z.string(),
    email: z.string(),
  }),
})

export const collectorSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  email: z.string(),
})

export const importPreviewSchema = z.object({
  fileName: z.string(),
  sheetName: z.string(),
  summary: z.object({
    totalRows: z.number().int(),
    validRows: z.number().int(),
    errorRows: z.number().int(),
  }),
  rows: z.array(
    z.object({
      row: z.number().int(),
      ownerName: z.string().nullable(),
      rt: z.string().nullable(),
      gang: z.string().nullable(),
      addressNote: z.string().nullable(),
      nextDueDate: z.string().nullable(),
      intervalDays: z.number().int().nullable(),
      defaultFee: z.number().int().nullable(),
      valid: z.boolean(),
      errors: z.array(z.string()),
    }),
  ),
})

export const importConfirmSchema = z.object({
  importedHouses: z.number().int(),
  failedRows: z.number().int(),
})

export type AdminHouse = z.infer<typeof adminHouseSchema>
export type AdminCollector = z.infer<typeof collectorSchema>
export type ImportPreview = z.infer<typeof importPreviewSchema>
export type ImportPreviewRow = ImportPreview['rows'][number]

export async function fetchAdminHouses(): Promise<readonly AdminHouse[]> {
  return cachedGet({ method: 'GET', url: '/admin/houses' }, adminHouseSchema.array())
}

export async function fetchAdminCollectors(): Promise<readonly AdminCollector[]> {
  return cachedGet({ method: 'GET', url: '/admin/collectors' }, collectorSchema.array())
}

export async function uploadImportPreview(file: File): Promise<ImportPreview> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post<unknown>('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return importPreviewSchema.parse(response.data)
}

export async function confirmHouseImport(
  preview: ImportPreview,
): Promise<z.infer<typeof importConfirmSchema>> {
  const houses = preview.rows
    .filter(
      (
        row,
      ): row is ImportPreviewRow & {
        ownerName: string
        rt: string
        gang: string
        nextDueDate: string
      } =>
        row.valid &&
        row.ownerName !== null &&
        row.rt !== null &&
        row.gang !== null &&
        row.nextDueDate !== null,
    )
    .map((row) => ({
      ownerName: row.ownerName,
      rt: row.rt,
      gang: row.gang,
      addressNote: row.addressNote ?? undefined,
      nextDueDate: row.nextDueDate,
      intervalDays: row.intervalDays ?? 7,
      defaultFee: row.defaultFee ?? 5000,
    }))
  const response = await request(
    {
      method: 'POST',
      url: '/import/confirm',
      data: {
        houses,
        importType: 'houses',
        fileName: preview.fileName,
        fileType: preview.fileName.split('.').pop() ?? 'excel',
      },
    },
    importConfirmSchema,
  )
  return response
}
