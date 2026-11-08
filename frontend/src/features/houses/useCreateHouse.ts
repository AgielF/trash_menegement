import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { useAuthStore } from '@/features/auth/store'
import { fetchAdminCollectors, fetchAdminHouses, type AdminCollector } from '@/features/admin/api'
import { getTodayWib, toWibDateString } from '@/shared/lib/date'
import { createHouse, updateHouse } from './api'

export interface HouseFormValues {
  ownerName: string
  rt: string
  gang: string
  addressNote: string
  defaultFee: string
  intervalDays: string
  nextDueDate: string
  collectorId: string
}

const INITIAL_FORM: HouseFormValues = {
  ownerName: '',
  rt: '',
  gang: '',
  addressNote: '',
  defaultFee: '5000',
  intervalDays: '7',
  nextDueDate: toWibDateString(getTodayWib()),
  collectorId: '',
}

export function useCreateHouse(houseId?: string): {
  form: HouseFormValues
  update: <K extends keyof HouseFormValues>(key: K, value: HouseFormValues[K]) => void
  collectors: readonly AdminCollector[]
  isAdmin: boolean
  loading: boolean
  busy: boolean
  error: string | null
  submit: () => Promise<boolean>
} {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.roles.includes('admin') === true
  const [form, setForm] = useState<HouseFormValues>(INITIAL_FORM)
  const [collectors, setCollectors] = useState<readonly AdminCollector[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cancelled = { value: false }
    void (async () => {
      try {
        if (isAdmin) {
          const collectorPromise = fetchAdminCollectors()
          if (houseId !== undefined) {
            const [availableCollectors, houses] = await Promise.all([
              collectorPromise,
              fetchAdminHouses(),
            ])
            if (cancelled.value) return
            setCollectors(availableCollectors)
            const house = houses.find((item) => item.id === houseId)
            if (house === undefined) {
              setError('Rumah tidak ditemukan atau sudah dinonaktifkan.')
            } else {
              setForm({
                ownerName: house.ownerName,
                rt: house.rt,
                gang: house.gang,
                addressNote: house.addressNote ?? '',
                defaultFee: String(house.defaultFee),
                intervalDays: String(house.intervalDays),
                nextDueDate: house.nextDueDate?.slice(0, 10) ?? '',
                collectorId: house.collector.id,
              })
            }
          } else {
            const availableCollectors = await collectorPromise
            if (!cancelled.value) setCollectors(availableCollectors)
          }
        }
      } catch (caught: unknown) {
        if (!cancelled.value) {
          setError(
            caught instanceof ApiError && caught.status === 429
              ? 'Gagal memuat data. Harap tunggu sebentar.'
              : caught instanceof ApiError
                ? caught.message
                : 'Gagal memuat data rumah atau petugas.',
          )
        }
      } finally {
        if (!cancelled.value) setLoading(false)
      }
    })()
    return () => {
      cancelled.value = true
    }
  }, [houseId, isAdmin])

  function update<K extends keyof HouseFormValues>(key: K, value: HouseFormValues[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(): Promise<boolean> {
    setBusy(true)
    setError(null)
    const defaultFee = Number(form.defaultFee)
    const intervalDays = Number(form.intervalDays)
    if (!Number.isInteger(defaultFee) || defaultFee < 0) {
      setError('Nominal default harus bilangan bulat minimal 0.')
      setBusy(false)
      return false
    }
    if (!Number.isInteger(intervalDays) || intervalDays < 1) {
      setError('Interval harus bilangan bulat minimal 1 hari.')
      setBusy(false)
      return false
    }
    if (isAdmin && form.collectorId === '') {
      setError('Pilih petugas untuk rumah ini.')
      setBusy(false)
      return false
    }

    try {
      const body = {
        ownerName: form.ownerName.trim(),
        rt: form.rt.trim(),
        gang: form.gang.trim(),
        addressNote: form.addressNote.trim() || undefined,
        defaultFee,
        intervalDays,
        nextDueDate: form.nextDueDate,
        ...(isAdmin ? { collectorId: form.collectorId } : {}),
      }
      if (houseId !== undefined) {
        await updateHouse(houseId, body)
      } else {
        await createHouse(body)
      }
      return true
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menyimpan data rumah.')
      return false
    } finally {
      setBusy(false)
    }
  }

  return { form, update, collectors, isAdmin, loading, busy, error, submit }
}
