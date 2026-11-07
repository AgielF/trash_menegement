import { useEffect, useState } from 'react'
import { z } from 'zod'
import { cachedGet } from '@/shared/api/requestCache'
import { ApiError } from '@/shared/api/http'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { Logo } from '@/shared/components/ui/Logo'
import { PlaceholderAvatar } from '@/shared/components/ui/Placeholder'
import { useAuthStore } from '@/features/auth/store'
import { formatWibDateLabel, getTodayWib } from '@/shared/lib/date'
import { navigate } from '@/shared/lib/router'
import { LogOut } from 'lucide-react'

const adminStatsSchema = z.object({
  totalHouses: z.number().int().nonnegative(),
  totalCollectors: z.number().int().nonnegative(),
  pendingUsers: z.number().int().nonnegative(),
})

type AdminStats = z.infer<typeof adminStatsSchema>

const STAT_CARDS: readonly {
  key: keyof AdminStats
  title: string
  description: string
  icon: string
}[] = [
  {
    key: 'totalHouses',
    title: 'Total Rumah',
    description: 'Rumah aktif terdaftar',
    icon: '⌂',
  },
  {
    key: 'totalCollectors',
    title: 'Total Petugas',
    description: 'Petugas disetujui',
    icon: '♙',
  },
  {
    key: 'pendingUsers',
    title: 'Menunggu Persetujuan',
    description: 'User perlu ditinjau',
    icon: '◷',
  },
]

export function AdminDashboardPage(): React.ReactElement {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void cachedGet({ method: 'GET', url: '/admin/stats' }, adminStatsSchema)
      .then(setStats)
      .catch((caught: unknown) => {
        setError(
          caught instanceof ApiError && caught.status === 429
            ? 'Gagal memuat data. Harap tunggu sebentar.'
            : caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat statistik admin.',
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  function onLogout(): void {
    logout({ force: true })
    navigate('/login')
  }

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlaceholderAvatar />
            <span className="text-lg font-bold">{user?.fullName ?? 'Admin'}</span>
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
              <LogOut aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs font-medium opacity-90">{formatWibDateLabel(getTodayWib())}</p>
      </CurvedHeader>

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">Halo, {user?.fullName ?? 'Admin'}</h2>
          <p className="text-sm text-neutral-600">Ringkasan pengelolaan Bersihku.</p>
        </div>

        {error !== null ? (
          <p role="alert" className="mt-3 rounded-2xl bg-white p-4 text-sm text-status-kasbon">
            {error}
          </p>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {STAT_CARDS.map((card) => {
            const target = card.key === 'totalHouses' ? '/admin/houses' : '/admin/settings'
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  navigate(target)
                }}
                className="cursor-pointer rounded-2xl bg-card-green p-4 text-left text-white shadow-sm transition duration-200 hover:scale-[1.02] hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-2xl"
                  >
                    {card.icon}
                  </span>
                  <span className="text-2xl font-bold">
                    {loading ? '…' : String(stats?.[card.key] ?? 0)}
                  </span>
                </div>
                <h2 className="mt-3 text-sm font-bold">{card.title}</h2>
                <p className="text-xs text-white/80">{card.description}</p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
