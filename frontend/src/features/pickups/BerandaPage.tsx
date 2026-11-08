import { useBeranda } from './useBeranda'
import { useAuthStore } from '@/features/auth/store'
import { Logo } from '@/shared/components/ui/Logo'
import { Button } from '@/shared/components/ui/Button'
import { PlaceholderAvatar } from '@/shared/components/ui/Placeholder'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { getTodayWib, formatWibDateLabel } from '@/shared/lib/date'
import { useNavigate } from 'react-router-dom'
import { APP_PATHS } from '@/config/routes'
import { DashboardStats } from './components/DashboardStats'

export function BerandaPage(): React.ReactElement {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const {
    stats,
    local,
    offline,
    loading,
    starting,
    startError,
    syncing,
    pendingCount,
    startDay,
    sync,
  } = useBeranda()

  async function onStartDay(): Promise<void> {
    if (await startDay()) {
      void navigate(APP_PATHS.houses)
    }
  }

  async function onSync(): Promise<void> {
    await sync()
  }

  function onLogout(): void {
    logout({ force: true })
  }

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
      <CurvedHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlaceholderAvatar />
            <span className="text-lg font-bold">{user?.fullName ?? 'Petugas'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Logo />
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar"
              title="Keluar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs font-medium opacity-90">{formatWibDateLabel(getTodayWib())}</p>
      </CurvedHeader>

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">
            Hallo {user?.fullName ?? 'Petugas'}
          </h2>
          <p className="text-sm text-neutral-600">Selamat Bertugas Hari Ini</p>
        </div>

        <DashboardStats
          progressPercent={progressPercent}
          pickedToday={pickedToday}
          totalHouses={totalHouses}
          bagsToday={bagsToday}
          moneyToday={moneyToday}
          loading={loading}
        />

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

        <div className="mt-3 flex justify-center">
          <Button
            label={
              syncing
                ? 'Menyinkronkan…'
                : pendingCount !== null && pendingCount > 0
                  ? `Sinkronkan (${pendingCount.toString()} data)`
                  : 'Sinkronkan'
            }
            variant="pill-green"
            loading={syncing}
            onClick={() => {
              void onSync()
            }}
          />
        </div>
      </section>
    </div>
  )
}
