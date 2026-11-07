// src/config/navigation.ts
// Satu sumber kebenaran navigasi: label, rute, role, dan kunci ikon PNG resmi
// dari Figma (src/assets/images). Dua nama ikon eksak dari file ekspor desainer.
export type Role = 'admin' | 'collector'

export interface NavItem {
  to: string
  label: string
  roles: readonly Role[]
  /** Kunci ke IkonNav di src/app/BottomNavigation.tsx (amP: tidak string ajaib). */
  icon: 'clipboard' | 'house' | 'people' | 'money'
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Beranda', roles: ['collector', 'admin'], icon: 'clipboard' },
  { to: '/rumah', label: 'Rumah', roles: ['collector', 'admin'], icon: 'house' },
  { to: '/kasbon', label: 'Kasbon', roles: ['collector'], icon: 'people' },
  { to: '/uang', label: 'Uang', roles: ['collector'], icon: 'money' },
  { to: '/admin', label: 'Admin', roles: ['admin'], icon: 'people' },
]

export const navFor = (roles: readonly Role[]): NavItem[] =>
  NAV_ITEMS.filter((item) => item.roles.some((r) => roles.includes(r)))
