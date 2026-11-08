import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { APP_PATHS, APP_ROUTES, type AppRole } from '@/config/routes'

/**
 * Bottom navigation terpadu:
 * - Membaca konfigurasi rute dari `routes.ts` berdasarkan role user aktif ('admin' atau 'collector').
 * - Hanya ada SATU elemen bar navigasi tanpa duplikasi markup.
 * - Menggunakan ikon PNG resmi atau ikon Lucide sesuai konfigurasi rute.
 */
export function BottomNavigation(): ReactElement | null {
  const user = useAuthStore((state) => state.user)
  if (user === null) return null

  const activeRole: AppRole = user.roles.includes('admin') ? 'admin' : 'collector'
  const navItems = APP_ROUTES.filter(
    (route) => route.showInNav && route.navRoles?.includes(activeRole),
  ).sort((left, right) => (left.navOrder ?? 0) - (right.navOrder ?? 0))

  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky bottom-0 z-10 flex h-14 shrink-0 items-center justify-around bg-nav-bar"
    >
      {navItems.map((item) => {
        const label = item.navLabel ?? item.path
        const Icon = item.navIcon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === APP_PATHS.admin}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              `flex h-11 min-w-11 items-center justify-center rounded-lg p-1.5 focus-visible:ring-2 focus-visible:ring-action ${
                isActive ? 'bg-white/70' : ''
              }`
            }
          >
            {typeof Icon === 'string' ? (
              <img src={Icon} alt="" aria-hidden="true" className="h-6 w-6" draggable={false} />
            ) : Icon !== undefined ? (
              <Icon aria-hidden="true" className="h-6 w-6 text-brand" strokeWidth={2} />
            ) : null}
            <span className="sr-only">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
