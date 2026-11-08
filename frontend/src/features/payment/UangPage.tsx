import { useUang } from './useUang'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import type { StatsRange } from '@/features/pickups/schemas'
import { formatRupiah } from './clamp'

/**
 * F14 — Rekap uang masuk. Sumber: GET /pickups/stats (server, kalender WIB)
 * dengan rentang hari ini/minggu/bulan; offline → hitungan Dexie (hanya hari ini).
 * Riwayat rincian: pembayaran aktif hari ini dari Dexie.
 */

const RANGE_LABELS: Record<StatsRange, string> = {
  today: 'Hari ini',
  week: 'Minggu ini',
  month: 'Bulan ini',
}

const RANGES: readonly StatsRange[] = ['today', 'week', 'month']

export function UangPage(): React.ReactElement {
  const { range, changeRange, stats, offline, localMoney, history, loading } = useUang()

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <h1 className="text-lg font-bold">Uang</h1>
        <p className="text-xs font-medium">Rekap uang masuk dan riwayat pembayaran</p>
      </CurvedHeader>

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
        <div role="tablist" aria-label="Rentang rekap" className="flex gap-2">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              onClick={() => {
                changeRange(item)
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-action ${
                range === item ? 'bg-brand text-white' : 'bg-white text-neutral-700 shadow-sm'
              }`}
            >
              {RANGE_LABELS[item]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-5 text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-3xl bg-card-green px-5 py-5 text-white shadow-sm">
              <p className="text-sm font-bold">Total Uang Masuk</p>
              <p className="mt-1 text-3xl font-extrabold">
                {stats !== null
                  ? formatRupiah(stats.totalMoney)
                  : localMoney !== null
                    ? formatRupiah(localMoney)
                    : '—'}
              </p>
              <p className="mt-1 text-xs">
                {stats !== null
                  ? `${String(stats.totalCollected)} diambil · ${String(stats.pending)} belum · ${String(stats.totalBags)} karung`
                  : '—'}
              </p>
            </div>

            {stats === null && localMoney !== null ? (
              <p role="status" className="mt-2 text-center text-xs text-neutral-500">
                Offline — menampilkan hitungan lokal (hanya hari ini), menunggu sinkron.
              </p>
            ) : null}

            {range === 'today' ? (
              <div className="mt-5">
                <h2 className="px-1 text-sm font-bold text-neutral-900">
                  Riwayat pembayaran hari ini
                </h2>
                {history.length === 0 ? (
                  <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-center text-xs text-neutral-500 shadow-sm">
                    Belum ada pembayaran tercatat hari ini (lokal).
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2" aria-label="Riwayat pembayaran hari ini">
                    {history.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm"
                      >
                        <span className="truncate text-xs text-neutral-600">
                          {payment.note ?? 'Tanpa catatan'}
                        </span>
                        <span className="shrink-0 font-bold">{formatRupiah(payment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {offline && history.length === 0 ? (
                  <p role="status" className="mt-2 text-center text-xs text-neutral-500">
                    Offline — riwayat disarikan dari data lokal.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
