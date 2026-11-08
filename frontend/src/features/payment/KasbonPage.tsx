import { useKasbonList } from './useKasbonList'
import { useNavigate } from 'react-router-dom'
import { APP_PATHS } from '@/config/routes'
import { formatRupiah } from './clamp'

/**
 * F13 entry — daftar rumah dengan tagihan belum lunas (kasbon).
 * Sumber: Dexie (offline-first). Sisa per rumah dihitung dari
 * (feeAmount − Σ pembayaran aktif lokal). Angka bertanda "estimasi";
 * detail eksak per record di GET /payments/outstanding/:houseId.
 */

export function KasbonPage(): React.ReactElement {
  const navigate = useNavigate()
  const { houses, loading } = useKasbonList()

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <header className="rounded-b-3xl bg-brand px-5 pt-4 pb-6 text-white">
        <h1 className="text-lg font-bold">Kasbon</h1>
        <p className="text-xs font-medium">
          Daftar rumah dengan tagihan belum lunas (estimasi data lokal)
        </p>
      </header>
      <main className="flex flex-col gap-3 px-4 py-4">
        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : houses.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Tidak ada kasbon. Semua tagihan sudah lunas 🎉
          </p>
        ) : (
          houses.map((house) => (
            <button
              key={house.houseId}
              type="button"
              onClick={() => {
                void navigate(APP_PATHS.kasbonDetail(house.houseId))
              }}
              className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-action"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-neutral-900">{house.ownerName}</h2>
                  <p className="text-xs text-neutral-600">
                    RT {house.rt} · Gang {house.gang} · {String(house.recordCount)} catatan
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-status-kasbon">
                  {formatRupiah(house.sisaEstimate)}
                </p>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  )
}
