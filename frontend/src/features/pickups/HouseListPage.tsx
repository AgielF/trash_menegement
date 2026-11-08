import { useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { useAuthStore } from '@/features/auth/store'
import { todayKey } from './service'
import { useHouseList } from './useHouseList'
import { HouseCard } from './HouseCard'
import { BackButton } from '@/shared/components/ui/BackButton'
import { SearchField } from '@/shared/components/ui/SearchField'
import { useNavigate } from 'react-router-dom'
import { APP_PATHS } from '@/config/routes'
import { PickupModal } from './components/PickupModal'
import { SkipModal } from './components/SkipModal'

/**
 * F6/F7/F8 — Daftar Rumah petugas:
 * - Data: GET /pickups/today (kontrak resmi) dipakai
 *   saat daring; respons di-cache ke Dexie. Saat offline → dibaca dari Dexie.
 * - Kartu: warna status dari config/status.ts (abu/hijau/merah/kuning/koral).
 * - F7: klik kartu → dialog isi jumlah karung → PATCH /pickups/:id/pickup.
 * - F8: tombol Skip pada kartu belum diambil → dialog alasan wajib →
 *   POST /pickups/:id/skip. Keduanya offline-first (Dexie + outbox).
 */
export function HouseListPage(): React.ReactElement {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const canAddHouse = user?.roles.includes('admin') === true
  const {
    filtered,
    pendingRecordIds,
    query,
    setQuery,
    loading,
    offline,
    refresh,
    recordPickup,
    skipPickup,
  } = useHouseList()
  const [actionRecord, setActionRecord] = useState<PickupRow | null>(null)
  const [skipRecord, setSkipRecord] = useState<PickupRow | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] bg-surface">
      <header className="rounded-b-3xl bg-brand px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <BackButton />
          <span className="text-[9px] font-bold tracking-wide text-white">BERSHIKU</span>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="CARI..."
          ariaLabel="Cari rumah"
          className="mt-2"
        />
      </header>

      <main className="flex flex-col gap-3 px-4 py-4">
        {canAddHouse ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                void navigate(APP_PATHS.createHouse)
              }}
              className="rounded-full bg-card-green px-5 py-2.5 text-xs font-bold tracking-wide text-white shadow-sm focus-visible:ring-2 focus-visible:ring-action"
            >
              + Tambah Rumah
            </button>
          </div>
        ) : null}
        {offline ? (
          <p
            role="status"
            className="mx-auto w-fit rounded-full bg-white px-4 py-1 text-xs font-medium text-neutral-700 shadow-sm"
          >
            Offline — perubahan tersimpan lokal, menunggu sinkron
          </p>
        ) : null}
        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Belum ada rumah hari ini. Coba mulai hari lewat tombol Mulai Ambil Sampah di Beranda.
          </p>
        ) : (
          filtered.map((row) => {
            const skippedToday = row.skips.some((skip) => skip.skipDate === todayKey())
            return (
              <div key={row.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDialogError(null)
                    setActionRecord(row)
                  }}
                  aria-label={`Buka detail pengambilan ${row.house.ownerName}`}
                  className="w-full text-left focus-visible:ring-2 focus-visible:ring-action"
                >
                  <HouseCard
                    house={{
                      id: row.id,
                      ownerName: row.house.ownerName,
                      rt: row.house.rt,
                      gang: row.house.gang,
                      pickupStatus: row.pickupStatus,
                      paymentStatus: row.paymentStatus,
                      skippedToday,
                      pendingSync: pendingRecordIds.has(row.id),
                    }}
                  />
                </button>
                {row.pickupStatus === 'belum_diambil' && !skippedToday ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDialogError(null)
                      setSkipRecord(row)
                    }}
                    className="absolute right-3 bottom-2.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm focus-visible:ring-2 focus-visible:ring-action"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
            )
          })
        )}
      </main>

      {actionRecord !== null ? (
        <PickupModal
          key={`pickup-${actionRecord.id}`}
          record={actionRecord}
          recordPickup={recordPickup}
          onClose={() => {
            setActionRecord(null)
          }}
          onDone={() => {
            void refresh()
          }}
          onErrorSetter={setDialogError}
          error={dialogError}
        />
      ) : null}
      {skipRecord !== null ? (
        <SkipModal
          key={`skip-${skipRecord.id}`}
          record={skipRecord}
          skipPickup={skipPickup}
          onClose={() => {
            setSkipRecord(null)
          }}
          onDone={() => {
            void refresh()
          }}
          onErrorSetter={setDialogError}
          error={dialogError}
        />
      ) : null}
    </div>
  )
}
