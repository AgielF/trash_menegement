import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { TextField } from '@/shared/components/ui/TextField'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { useToast } from '@/shared/components/ui/toast-constants'
import { fetchAdminSettings, setKasbonLimit } from '@/features/payment/api'
import { formatRupiah } from '@/features/payment/clamp'
import { useNavigate } from 'react-router-dom'
import { APP_PATHS } from '@/config/routes'

/**
 * F16 — Halaman Pengaturan (admin-only): batas kasbon global
 * (PATCH /admin/settings/kasbon-limit { value }). Otorisasi di server.
 */
export function AdminSettingsPage(): React.ReactElement {
  const navigate = useNavigate()
  const [current, setCurrent] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    void (async () => {
      try {
        const settings = await fetchAdminSettings()
        setCurrent(settings.kasbonLimit)
        setValue(settings.kasbonLimit !== null ? String(settings.kasbonLimit) : '')
      } catch (caught: unknown) {
        setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
      }
      setLoading(false)
    })()
  }, [])

  async function submit(): Promise<void> {
    setError(null)
    setNotice(null)
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      setError('Batas kasbon harus bilangan bulat ≥ 0.')
      return
    }
    setBusy(true)
    try {
      const updated = await setKasbonLimit(parsed)
      setCurrent(Number.parseInt(updated.value, 10))
      setNotice(`Batas kasbon disimpan: ${formatRupiah(Number.parseInt(updated.value, 10))}.`)
      showToast('Batas kasbon berhasil disimpan.', 'success')
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
      showToast(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <h1 className="text-lg font-bold">Pengaturan Admin</h1>
        <p className="text-xs font-medium">Konfigurasi global aplikasi</p>
      </CurvedHeader>

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              void navigate(APP_PATHS.adminPending)
            }}
            className="rounded-2xl bg-white px-4 py-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-action"
          >
            <h2 className="text-sm font-bold text-neutral-900">Persetujuan Petugas</h2>
            <p className="mt-1 text-xs text-neutral-600">
              Tinjau dan kelola user yang menunggu verifikasi.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              void navigate(APP_PATHS.adminHouses)
            }}
            className="rounded-2xl bg-white px-4 py-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-action"
          >
            <h2 className="text-sm font-bold text-neutral-900">Manajemen Rumah &amp; Jadwal</h2>
            <p className="mt-1 text-xs text-neutral-600">
              Kelola rumah, petugas, nominal, dan jadwal.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              void navigate(APP_PATHS.adminImport)
            }}
            className="rounded-2xl bg-white px-4 py-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-action"
          >
            <h2 className="text-sm font-bold text-neutral-900">Import Data Rumah</h2>
            <p className="mt-1 text-xs text-neutral-600">
              Pratinjau dan import data rumah dari spreadsheet.
            </p>
          </button>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900">Pengaturan Global</h2>
            <p className="mt-1 text-xs text-neutral-600">
              Konfigurasi yang berlaku untuk seluruh aplikasi.
            </p>
          </div>
        </div>

        {error !== null ? (
          <p role="alert" className="mb-3 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat pengaturan…
          </p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
            className="rounded-3xl bg-white p-5 shadow-sm"
            noValidate
          >
            <h2 className="text-sm font-bold text-neutral-900">Batas Kasbon Global</h2>
            <p className="mt-1 text-xs text-neutral-600">
              {current !== null
                ? `Saat ini: ${formatRupiah(current)}`
                : 'Belum disetel (tanpa batas).'}
            </p>
            <div className="mt-3">
              <TextField
                name="kasbonLimit"
                label="Batas kasbon (rupiah)"
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(next) => {
                  setValue(next)
                }}
                showLabel
              />
            </div>
            {notice !== null ? (
              <p role="status" className="mt-2 text-xs font-medium text-brand">
                {notice}
              </p>
            ) : null}
            <div className="mt-4">
              <Button label="Simpan Batas" type="submit" loading={busy} />
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
