import { useEffect, useState } from 'react'
import { db } from '@/shared/db/db'
import { ApiError } from '@/shared/api/http'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { fetchStats } from '@/features/pickups/service'
import type { StatsRange, StatsResponse } from '@/features/pickups/schemas'
import { toWibDateString, getTodayWib } from '@/shared/lib/date'
import { formatRupiah } from './clamp'
import { activePaymentsOfDay } from './aggregate'

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
  const [range, setRange] = useState<StatsRange>('today')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [offline, setOffline] = useState(false)
  const [localMoney, setLocalMoney] = useState<number | null>(null)
  const [history, setHistory] = useState<
    readonly { id: string; amount: number; paidAt: string; note: string | null }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetchStats(range)
        setStats(response)
        setOffline(false)
      } catch (error) {
        setStats(null)
        setOffline(!(error instanceof ApiError && error.status !== null))
        if (range === 'today') {
          const today = toWibDateString(getTodayWib())
          setLocalMoney(
            activePaymentsOfDay(await db.payments.toArray(), today).reduce(
              (total, payment) => total + payment.amount,
              0,
            ),
          )
        }
      }
      // Riwayat rincian hanya relevan untuk hari ini.
      if (range === 'today') {
        const today = toWibDateString(getTodayWib())
        const rows = activePaymentsOfDay(await db.payments.toArray(), today)
        setHistory(rows.map(({ id, amount, paidAt, note }) => ({ id, amount, paidAt, note })))
      } else {
        setHistory([])
      }
      setLoading(false)
    })()
  }, [range])

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <h1 className="text-lg font-bold">Uang</h1>
        <p className="text-xs font-medium">Rekap uang masuk dan riwayat pembayaran</p>
      </CurvedHeader>

      <section className="relative -mt-6 rounded-tl-[2.5rem] bg-surface px-5 pt-6">
        <div role="tablist" aria-label="Rentang rekap" className="flex gap-2">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              onClick={() => {
                setRange(item)
                setStats(null)
                setLocalMoney(null)
                setLoading(true)
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
