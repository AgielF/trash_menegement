import { createElement, type ReactElement } from 'react'
import clipboardIcon from '@/assets/images/cicon-clibboard.png'
import houseIcon from '@/assets/images/icon-rumah-footerbar.png'
import moneyIcon from '@/assets/images/icon-money-footerbar.png'
import peopleIcon from '@/assets/images/icon-profile-footerbar.png'
import { Building2, LayoutDashboard, Settings, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { AdminHousesPage } from '@/features/admin/AdminHousesPage'
import { AdminPendingPage } from '@/features/admin/AdminPendingPage'
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage'
import { ImportPage } from '@/features/admin/ImportPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { KasbonDetailPage } from '@/features/payment/KasbonDetailPage'
import { KasbonPage } from '@/features/payment/KasbonPage'
import { UangPage } from '@/features/payment/UangPage'
import { BerandaPage } from '@/features/pickups/BerandaPage'
import { HouseListPage } from '@/features/pickups/HouseListPage'
import { CreateHousePage } from '@/features/houses/CreateHousePage'
import { Navigate, useParams } from 'react-router-dom'

export type AppRole = 'admin' | 'collector'

export const APP_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  profile: '/profile',
  houses: '/rumah',
  createHouse: '/houses/create',
  editHouse: (houseId: string): string => `/houses/edit/${houseId}`,
  editHousePattern: '/houses/edit/:houseId',
  kasbon: '/kasbon',
  kasbonDetail: (houseId: string): string => `/kasbon/${houseId}`,
  kasbonDetailPattern: '/kasbon/:houseId',
  uang: '/uang',
  admin: '/admin',
  adminHouses: '/admin/houses',
  adminPending: '/admin/pending',
  adminSettings: '/admin/settings',
  adminImport: '/admin/import',
} as const

export interface AppRoute {
  path: string
  element: ReactElement
  requiredRole?: AppRole
  parentPath?: string | Partial<Record<AppRole, string>>
  showInNav: boolean
  public?: boolean
  navLabel?: string
  navIcon?: LucideIcon | string
  navRoles?: readonly AppRole[]
  navOrder?: number
}

function HomeRoute(): ReactElement {
  const user = useAuthStore((state) => state.user)
  return createElement(user?.roles.includes('admin') === true ? AdminDashboardPage : BerandaPage)
}

function KasbonDetailRoute(): ReactElement {
  const { houseId } = useParams()
  return createElement(KasbonDetailPage, { houseId: houseId ?? '', ownerName: null })
}

function EditHouseRoute(): ReactElement {
  const { houseId } = useParams()
  return createElement(CreateHousePage, { houseId: houseId ?? '' })
}

/** Single source for route rendering, role protection, back hierarchy and nav. */
export const APP_ROUTES: readonly AppRoute[] = [
  { path: APP_PATHS.login, element: createElement(LoginPage), showInNav: false, public: true },
  {
    path: APP_PATHS.register,
    element: createElement(RegisterPage),
    showInNav: false,
    public: true,
  },
  {
    path: APP_PATHS.home,
    element: createElement(HomeRoute),
    showInNav: false,
  },
  {
    path: APP_PATHS.houses,
    element: createElement(HouseListPage),
    parentPath: APP_PATHS.home,
    showInNav: true,
    navLabel: 'Rumah',
    navIcon: houseIcon,
    navRoles: ['collector'],
    navOrder: 3,
  },
  {
    path: APP_PATHS.createHouse,
    element: createElement(CreateHousePage),
    parentPath: { admin: APP_PATHS.adminHouses, collector: APP_PATHS.houses },
    showInNav: false,
  },
  {
    path: APP_PATHS.editHousePattern,
    element: createElement(EditHouseRoute),
    requiredRole: 'admin',
    parentPath: APP_PATHS.adminHouses,
    showInNav: false,
  },
  {
    path: APP_PATHS.profile,
    element: createElement(BerandaPage),
    showInNav: true,
    navLabel: 'Profil',
    navIcon: peopleIcon,
    navRoles: ['collector'],
    navOrder: 2,
  },
  {
    path: APP_PATHS.kasbon,
    element: createElement(KasbonPage),
    showInNav: true,
    navLabel: 'Kasbon',
    navIcon: clipboardIcon,
    navRoles: ['collector'],
    navOrder: 1,
  },
  {
    path: APP_PATHS.kasbonDetailPattern,
    element: createElement(KasbonDetailRoute),
    parentPath: APP_PATHS.houses,
    showInNav: false,
  },
  {
    path: APP_PATHS.uang,
    element: createElement(UangPage),
    parentPath: APP_PATHS.home,
    showInNav: true,
    navLabel: 'Uang',
    navIcon: moneyIcon,
    navRoles: ['collector'],
    navOrder: 4,
  },
  {
    path: APP_PATHS.admin,
    element: createElement(AdminDashboardPage),
    requiredRole: 'admin',
    showInNav: true,
    navLabel: 'Dashboard',
    navIcon: LayoutDashboard,
    navRoles: ['admin'],
    navOrder: 1,
  },
  {
    path: APP_PATHS.adminHouses,
    element: createElement(AdminHousesPage),
    requiredRole: 'admin',
    parentPath: APP_PATHS.admin,
    showInNav: true,
    navLabel: 'Rumah',
    navIcon: Building2,
    navRoles: ['admin'],
    navOrder: 2,
  },
  {
    path: APP_PATHS.adminPending,
    element: createElement(AdminPendingPage),
    requiredRole: 'admin',
    parentPath: APP_PATHS.adminSettings,
    showInNav: false,
  },
  {
    path: APP_PATHS.adminSettings,
    element: createElement(AdminSettingsPage),
    requiredRole: 'admin',
    parentPath: APP_PATHS.admin,
    showInNav: true,
    navLabel: 'Setting',
    navIcon: Settings,
    navRoles: ['admin'],
    navOrder: 3,
  },
  {
    path: APP_PATHS.adminImport,
    element: createElement(ImportPage),
    requiredRole: 'admin',
    parentPath: APP_PATHS.adminSettings,
    showInNav: false,
  },
  {
    path: '*',
    element: createElement(Navigate, { to: APP_PATHS.home, replace: true }),
    showInNav: false,
  },
]
