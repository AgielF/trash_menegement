import clipboardIcon from '@/assets/images/cicon-clibboard.png'
import houseIcon from '@/assets/images/icon-rumah-footerbar.png'
import moneyIcon from '@/assets/images/icon-money-footerbar.png'
import peopleIcon from '@/assets/images/icon-profile-footerbar.png'
import { useRouterPath } from '@/shared/lib/router'
import { useAuthStore } from '@/features/auth/store'
import { navFor } from '@/config/navigation'
import type { NavItem, Role } from '@/config/navigation'

// Ikon PNG resmi dari Figma (22×22 px). Satu-satunya pemetaan kunci → file.
const ICONS: Record<NavItem['icon'], string> = {
  clipboard: clipboardIcon,
  house: houseIcon,
  people: peopleIcon,
  money: moneyIcon,
}

/** Bottom navigation memakai ikon PNG asli Figma — bukan SVG rekreasi. */
export function BottomNavigation(): React.ReactElement | null {
  const user = useAuthStore((s) => s.user)
  const path = useRouterPath()
  if (user === null) return null
  // Cek role hanya untuk UX (ikon mengikuti role); otorisasi tetap di server.
  const roles = user.roles.filter((r): r is Role => r === 'admin' || r === 'collector')
  const items = navFor(roles)
  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky bottom-0 z-10 flex h-14 shrink-0 items-center justify-around bg-nav-bar"
    >
      {items.map((item) => {
        const active = path === item.to
        return (
          <a
            key={item.to}
            href={`#${item.to}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
            className={`flex h-11 min-w-11 items-center justify-center rounded-lg p-1.5 focus-visible:ring-2 focus-visible:ring-action ${
              active ? 'bg-white/70' : ''
            }`}
          >
            <img
              src={ICONS[item.icon]}
              alt=""
              aria-hidden="true"
              className="h-6 w-6"
              draggable={false}
            />
            {/* Label teks agar status aktif tidak hanya dari warna (WCAG). */}
            <span className="sr-only">{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
