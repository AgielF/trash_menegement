import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { useAuthStore } from '@/features/auth/store'
import { Logo } from '@/shared/components/ui/Logo'
import { Button } from '@/shared/components/ui/Button'
import { PlaceholderAvatar } from '@/shared/components/ui/Placeholder'
import { getTodayWib, formatWibDateLabel } from '@/shared/lib/date'
import {
  cacheTodayRows,
  fetchStats,
  fetchToday,
  gatherBeranda,
  startDayOnline,
  type BerandaSnapshot,
} from './service'
import type { StatsResponse } from './schemas'

/** Tarik terbaru dari kontrak resmi bila online; selain itu biarkan data Dexie. */
async function refreshRemoteToday(): Promise<boolean> {
  try {
    const remote = await fetchToday()
    await cacheTodayRows(remote)
    return false
  } catch (error) {
    // Gagal-request dianggap offline (playbook).
    return !(error instanceof ApiError && error.status !== null)
  }
}

export function BerandaPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [local, setLocal] = useState<BerandaSnapshot | null>(null)
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  useEffect(() => {
    const cancelled = { value: false }
    void (async () => {
      const isOffline = await refreshRemoteToday()
      if (!isOffline) {
        try {
          // Kartu Beranda sumber utamanya /pickups/stats (kalender WIB di server).
          const response = await fetchStats('today')
          if (!cancelled.value) setStats(response)
        } catch (error) {
          if (!(error instanceof ApiError && error.status !== null)) {
            if (!cancelled.value) setStats(null)
          }
        }
      }
      const snapshot = await gatherBeranda()
      if (cancelled.value) return
      setOffline(isOffline)
      setLocal(snapshot)
      setLoading(false)
    })()
    return () => {
      cancelled.value = true
    }
  }, [])

  async function onStartDay(): Promise<void> {
    setStartError(null)
    setStarting(true)
    try {
      await startDayOnline()
      try {
        const response = await fetchStats('today')
        setStats(response)
      } catch {
        setStats(null)
      }
      setLocal(await gatherBeranda())
    } catch (error) {
      setStartError(error instanceof ApiError ? error.message : 'Gagal memulai hari (cek koneksi).')
    } finally {
      setStarting(false)
    }
  }

  // Informasi tampilan: prioritas statistik server; offline → hitungan Dexie lokal.
  const progressPercent =
    stats !== null
      ? Math.round(stats.progress)
      : local !== null && local.pickedToday + local.remaining > 0
        ? Math.round((local.pickedToday / (local.pickedToday + local.remaining)) * 100)
        : 0
  const pickedToday = stats?.totalCollected ?? local?.pickedToday ?? 0
  const totalHouses =
    stats !== null
      ? stats.totalCollected + stats.pending
      : (local?.pickedToday ?? 0) + (local?.remaining ?? 0)
  const bagsToday = stats?.totalBags ?? local?.bagsToday ?? 0
  const moneyToday = stats?.totalMoney ?? local?.moneyToday ?? 0

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <header className="relative bg-brand px-5 pt-4 pb-10 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PlaceholderAvatar />
              <span className="text-lg font-bold">{user?.fullName ?? 'Petugas'}</span>
            </div>
            <p className="mt-0.5 text-xs font-medium">{formatWibDateLabel(getTodayWib())}</p>
          </div>
          <Logo />
        </div>
      </header>

      <section className="relative -mt-6 rounded-tl-[2.5rem] bg-surface px-5 pt-6">
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">
            Hallo {user?.fullName ?? 'Petugas'}
          </h2>
          <p className="text-sm text-neutral-600">Selamat Bertugas Hari Ini</p>
        </div>

        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-card-green px-5 py-4 text-white shadow-sm">
          <div
            role="img"
            aria-label={`Progres hari ini ${String(progressPercent)}%`}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/90 text-sm font-bold text-brand"
          >
            {progressPercent}%
          </div>
          <div>
            <p className="text-sm font-bold">Hari ini</p>
            <p className="text-xs">
              {dataUnavailable(loading)
                ? 'Memuat…'
                : `${String(pickedToday)} dari ${String(totalHouses)} rumah`}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-card-green px-4 py-3 text-white shadow-sm">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-pink-200 text-pink-800"
            >
              🧺
            </span>
            <div>
              <p className="text-sm font-bold">Karung</p>
              <p className="text-xs">
                {dataUnavailable(loading) ? 'Memuat…' : `${String(bagsToday)} Pcs`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card-green px-4 py-3 text-white shadow-sm">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-red-200 text-red-800"
            >
              💵
            </span>
            <div>
              <p className="text-sm font-bold">Uang</p>
              <p className="text-xs">
                {dataUnavailable(loading) ? 'Memuat…' : `Rp. ${moneyToday.toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>
        </div>

        {offline ? (
          <p
            role="status"
            className="mx-auto mt-3 w-fit rounded-full bg-white px-4 py-1 text-center text-xs font-medium text-neutral-700 shadow-sm"
          >
            Offline — menampilkan hitungan lokal, menunggu sinkron
          </p>
        ) : null}
        {stats === null && !offline && !loading ? (
          <p role="status" className="mx-auto mt-1 w-fit text-center text-xs text-neutral-500">
            Statistik server tidak tersedia — memakai hitungan lokal.
          </p>
        ) : null}
        {startError !== null ? (
          <p role="alert" className="mx-auto mt-1 w-fit text-center text-xs text-status-kasbon">
            {startError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-center">
          <Button
            label="Mulai Ambil Sampah"
            variant="pill-green"
            loading={starting}
            disabled={offline}
            onClick={() => {
              void onStartDay()
            }}
          />
        </div>
      </section>
    </div>
  )
}

function dataUnavailable(loading: boolean): boolean {
  return loading
}
