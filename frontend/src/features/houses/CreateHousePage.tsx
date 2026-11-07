import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { useToast } from '@/shared/components/ui/toast-constants'
import { useAuthStore } from '@/features/auth/store'
import { createHouse, updateHouse } from './api'
import { fetchAdminCollectors, fetchAdminHouses, type AdminCollector } from '@/features/admin/api'
import { getTodayWib, toWibDateString } from '@/shared/lib/date'
import { navigate } from '@/shared/lib/router'

interface HouseForm {
  ownerName: string
  rt: string
  gang: string
  addressNote: string
  defaultFee: string
  intervalDays: string
  nextDueDate: string
  collectorId: string
}

const INITIAL_FORM: HouseForm = {
  ownerName: '',
  rt: '',
  gang: '',
  addressNote: '',
  defaultFee: '5000',
  intervalDays: '7',
  nextDueDate: toWibDateString(getTodayWib()),
  collectorId: '',
}

const INPUT_CLASS =
  'h-11 w-full rounded-full border border-neutral-200 bg-white px-5 text-sm text-neutral-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-action'

export function CreateHousePage({ houseId }: { houseId?: string }): React.ReactElement {
  const [form, setForm] = useState<HouseForm>(INITIAL_FORM)
  const [collectors, setCollectors] = useState<readonly AdminCollector[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()
  const isAdmin = user?.roles.includes('admin') === true

  useEffect(() => {
    void (async () => {
      try {
        if (isAdmin) {
          const collectorPromise = fetchAdminCollectors()
          if (houseId !== undefined) {
            const [availableCollectors, houses] = await Promise.all([
              collectorPromise,
              fetchAdminHouses(),
            ])
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
            setCollectors(await collectorPromise)
          }
        }
      } catch (caught: unknown) {
        setError(
          caught instanceof ApiError && caught.status === 429
            ? 'Gagal memuat data. Harap tunggu sebentar.'
            : caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat data rumah atau petugas.',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [houseId, isAdmin])

  function update<K extends keyof HouseForm>(key: K, value: HouseForm[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const defaultFee = Number(form.defaultFee)
    const intervalDays = Number(form.intervalDays)
    if (!Number.isInteger(defaultFee) || defaultFee < 0) {
      setError('Nominal default harus bilangan bulat minimal 0.')
      setBusy(false)
      return
    }
    if (!Number.isInteger(intervalDays) || intervalDays < 1) {
      setError('Interval harus bilangan bulat minimal 1 hari.')
      setBusy(false)
      return
    }
    if (isAdmin && form.collectorId === '') {
      setError('Pilih petugas untuk rumah ini.')
      setBusy(false)
      return
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
        showToast('Data rumah berhasil diperbarui.', 'success')
      } else {
        await createHouse(body)
        showToast('Rumah berhasil ditambahkan.', 'success')
      }
      navigate(isAdmin ? '/admin/houses' : '/rumah')
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menambahkan rumah.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <p className="text-[10px] font-bold tracking-widest text-white/80">MANAJEMEN RUMAH</p>
        <h1 className="mt-1 text-lg font-bold">
          {houseId === undefined ? 'Tambah Rumah' : 'Edit Rumah'}
        </h1>
        <p className="text-xs">
          {isAdmin
            ? 'Pilih petugas yang bertanggung jawab atas rumah ini.'
            : 'Rumah akan otomatis ditugaskan kepada akun yang sedang masuk.'}
        </p>
      </CurvedHeader>

      <form
        onSubmit={(event) => {
          void submit(event)
        }}
        className="relative -mt-7 flex flex-col gap-4 rounded-tl-[3rem] bg-surface px-5 pt-6"
      >
        {loading ? (
          <p className="text-center text-sm text-neutral-500" aria-busy="true">
            Memuat data rumah dan petugas…
          </p>
        ) : null}
        {isAdmin ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="collectorId" className="px-4 text-xs font-semibold text-neutral-700">
              Petugas (Collector)
            </label>
            <select
              id="collectorId"
              name="collectorId"
              required
              value={form.collectorId}
              onChange={(event) => {
                update('collectorId', event.target.value)
              }}
              className={INPUT_CLASS}
            >
              <option value="">Pilih petugas</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.fullName} · {collector.email}
                </option>
              ))}
            </select>
            {collectors.length === 0 && !loading ? (
              <p className="px-4 text-xs text-status-kasbon">
                Belum ada petugas disetujui untuk dipilih.
              </p>
            ) : null}
          </div>
        ) : null}
        <Field
          label="Nama pemilik"
          name="ownerName"
          value={form.ownerName}
          required
          onChange={(v) => {
            update('ownerName', v)
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="RT"
            name="rt"
            value={form.rt}
            required
            onChange={(v) => {
              update('rt', v)
            }}
          />
          <Field
            label="Gang"
            name="gang"
            value={form.gang}
            required
            onChange={(v) => {
              update('gang', v)
            }}
          />
        </div>
        <Field
          label="Catatan alamat (opsional)"
          name="addressNote"
          value={form.addressNote}
          onChange={(v) => {
            update('addressNote', v)
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Nominal default (Rp)"
            name="defaultFee"
            type="number"
            min="0"
            value={form.defaultFee}
            required
            onChange={(v) => {
              update('defaultFee', v)
            }}
          />
          <Field
            label="Interval (hari)"
            name="intervalDays"
            type="number"
            min="1"
            value={form.intervalDays}
            required
            onChange={(v) => {
              update('intervalDays', v)
            }}
          />
        </div>
        <Field
          label="Jatuh tempo berikutnya"
          name="nextDueDate"
          type="date"
          value={form.nextDueDate}
          required
          onChange={(v) => {
            update('nextDueDate', v)
          }}
        />
        {error !== null ? (
          <p role="alert" className="text-sm text-status-kasbon">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pb-4">
          <Button
            label={houseId === undefined ? 'Simpan Rumah' : 'Simpan Perubahan'}
            type="submit"
            variant="pill-green"
            loading={busy || loading}
          />
          <Button
            label="Batal"
            variant="pill-green"
            className="bg-neutral-500"
            onClick={() => {
              navigate(user?.roles.includes('admin') === true ? '/admin/houses' : '/rumah')
            }}
          />
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date'
  required?: boolean
  min?: string
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="px-4 text-xs font-semibold text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        required={required}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={INPUT_CLASS}
      />
    </div>
  )
}
