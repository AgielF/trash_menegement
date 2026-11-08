import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { Dialog } from '@/shared/components/ui/Dialog'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { fetchAdminHouses, type AdminHouse } from './api'
import { useNavigate } from 'react-router-dom'
import { formatWibDateLabel } from '@/shared/lib/date'
import { deleteHouse } from '@/features/houses/api'
import { APP_PATHS } from '@/config/routes'

function formatDate(value: string | null): string {
  return value === null ? 'Belum dijadwalkan' : formatWibDateLabel(new Date(value))
}

function formatFee(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdminHousesPage(): React.ReactElement {
  const navigate = useNavigate()
  const [houses, setHouses] = useState<readonly AdminHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [busyHouseId, setBusyHouseId] = useState<string | null>(null)
  const [houseToDelete, setHouseToDelete] = useState<AdminHouse | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAdminHouses()
      .then(setHouses)
      .catch((caught: unknown) => {
        setError(
          caught instanceof ApiError && caught.status === 429
            ? 'Gagal memuat data. Harap tunggu sebentar.'
            : caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat daftar rumah.',
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [refreshVersion])

  async function confirmDeleteHouse(): Promise<void> {
    if (houseToDelete === null) return
    setBusyHouseId(houseToDelete.id)
    setDeleteError(null)
    try {
      await deleteHouse(houseToDelete.id)
      setHouseToDelete(null)
      setRefreshVersion((version) => version + 1)
    } catch (caught: unknown) {
      setDeleteError(caught instanceof ApiError ? caught.message : 'Gagal menghapus rumah.')
    } finally {
      setBusyHouseId(null)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <p className="text-[10px] font-bold tracking-widest text-white/80">MANAJEMEN ADMIN</p>
        <h1 className="mt-1 text-lg font-bold">Daftar Rumah &amp; Jadwal</h1>
        <p className="text-xs">Semua rumah beserta petugas dan jadwal jatuh tempo.</p>
      </CurvedHeader>

      <section className="relative -mt-7 rounded-tl-[3rem] bg-surface px-4 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-neutral-600">
            {loading ? 'Memuat data…' : `${houses.length.toString()} rumah`}
          </p>
          <Button
            label="+ Tambah Rumah"
            variant="pill-green"
            onClick={() => {
              void navigate(APP_PATHS.createHouse)
            }}
          />
        </div>

        {error !== null ? (
          <p role="alert" className="rounded-2xl bg-white p-4 text-sm text-status-kasbon">
            {error}
          </p>
        ) : loading ? (
          <p className="py-8 text-center text-sm text-neutral-500" aria-busy="true">
            Memuat daftar rumah…
          </p>
        ) : houses.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-neutral-600">Belum ada rumah terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-190 border-collapse text-left text-xs">
              <thead className="bg-brand/10 text-neutral-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Nama Pemilik
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    RT / Gang
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Petugas
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Nominal Default
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Jatuh Tempo
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {houses.map((house) => {
                  const active = house.isActive && house.deletedAt === null
                  return (
                    <tr key={house.id} className="border-t border-neutral-100 align-top">
                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        {house.ownerName}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <span className="block">RT {house.rt}</span>
                        <span className="text-neutral-500">{house.gang}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <span className="block font-medium">{house.collector.fullName}</span>
                        <span className="text-neutral-500">{house.collector.email}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {formatFee(house.defaultFee)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <span className="block">{formatDate(house.nextDueDate)}</span>
                        <span className="text-neutral-500">Setiap {house.intervalDays} hari</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-bold ${
                            active ? 'bg-brand/10 text-brand' : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void navigate(APP_PATHS.editHouse(house.id))
                            }}
                            className="rounded-full bg-brand/10 px-3 py-1.5 font-bold text-brand focus-visible:ring-2 focus-visible:ring-action disabled:opacity-50"
                            disabled={busyHouseId === house.id}
                          >
                            Edit
                          </button>
                          <Button
                            label="Hapus"
                            variant="destructive"
                            className="px-3 py-1.5 text-xs font-bold tracking-normal normal-case"
                            disabled={busyHouseId === house.id}
                            onClick={() => {
                              setDeleteError(null)
                              setHouseToDelete(house)
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {houseToDelete !== null ? (
        <Dialog
          title="Konfirmasi Hapus"
          subtitle={`Nonaktifkan rumah milik ${houseToDelete.ownerName}?`}
          onClose={() => {
            setHouseToDelete(null)
          }}
          error={deleteError}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Data riwayat tetap tersimpan di sistem, namun rumah ini tidak akan dijadwalkan lagi
              untuk pengambilan rutin.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                label="Batal"
                variant="pill-green"
                className="bg-neutral-200! text-neutral-700!"
                onClick={() => {
                  setHouseToDelete(null)
                }}
              />
              <Button
                label={busyHouseId === houseToDelete.id ? 'Memproses…' : 'Hapus'}
                variant="destructive"
                loading={busyHouseId === houseToDelete.id}
                onClick={() => {
                  void confirmDeleteHouse()
                }}
              />
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}
