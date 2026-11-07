// src/config/navigation.ts — satu sumber kebenaran navigasi: label, rute, role,
// dan kunci ikon PNG resmi dari Figma (src/assets/images).
// Urutan footerbar (keputusan pemilik produk, 7 Nov): Kasbon, Profil, Rumah, Uang.
export type Role = 'admin' | 'collector'

export interface NavItem {
  to: string
  label: string
  roles: readonly Role[]
  /** Kunci ke ICONS di src/app/BottomNavigation.tsx (bukan string ajaib). */
  icon: 'clipboard' | 'house' | 'people' | 'money'
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/kasbon', label: 'Kasbon', roles: ['collector'], icon: 'clipboard' },
  { to: '/profile', label: 'Profil', roles: ['collector', 'admin'], icon: 'people' },
  { to: '/rumah', label: 'Rumah', roles: ['collector'], icon: 'house' },
  { to: '/uang', label: 'Uang', roles: ['collector'], icon: 'money' },
  // Tab kelima khusus admin (keputusan sebelumnya; ikon orang dipakai sementara —
  // ekspor ikon admin belum ada).
  { to: '/admin', label: 'Admin', roles: ['admin'], icon: 'people' },
]

export const navFor = (roles: readonly Role[]): NavItem[] =>
  NAV_ITEMS.filter((item) => item.roles.some((r) => roles.includes(r)))
