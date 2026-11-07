import { useEffect } from 'react'
import { matchRoute, type RouteConfig } from '@/shared/lib/router'
import { useRouterPath } from '@/shared/lib/router'
import { useAuthStore } from '@/features/auth/store'
import { configureHttp } from '@/shared/api/http'
import { startSyncTriggers } from '@/features/sync/service'
import { AppLayout } from './AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { BerandaPage } from '@/features/pickups/BerandaPage'
import { HouseListPage } from '@/features/pickups/HouseListPage'
import { KasbonPage } from '@/features/payment/KasbonPage'
import { KasbonDetailPage } from '@/features/payment/KasbonDetailPage'
import { UangPage } from '@/features/payment/UangPage'
import { AdminPage } from '@/features/admin/AdminPage'
import { NavigateStub } from './NavigateStub'

/** Sambungkan store auth ke http sekali — hindari impor melingkar api→store. */
function connectHttpToStore(): void {
  configureHttp({
    getToken: () => useAuthStore.getState().token,
    onUnauthorized: () => {
      useAuthStore.getState().logout({ force: true })
    },
    isAuthRequest: (url) => url.includes('/auth/'),
  })
}

connectHttpToStore()

const PUBLIC_ROUTES: readonly RouteConfig[] = [
  { path: '/login', component: () => <LoginPage /> },
  { path: '/register', component: () => <RegisterPage /> },
]

const SECURE_ROUTES: readonly RouteConfig[] = [
  { path: '/', component: () => <BerandaPage /> },
  { path: '/rumah', component: () => <HouseListPage /> },
  { path: '/kasbon', component: () => <KasbonPage /> },
  {
    path: '/kasbon/:houseId',
    component: ({ param }) => <KasbonDetailPage houseId={param ?? ''} ownerName={null} />,
  },
  { path: '/uang', component: () => <UangPage /> },
  // Halaman admin: cek role di UI hanya untuk UX; otorisasi di server (RolesGuard).
  { path: '/admin', component: () => <AdminPage />, adminOnly: true },
]

export function App(): React.ReactElement {
  const path = useRouterPath()
  const { hydrate, isReady, user } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    // Pemicu sinkron: start app, event online, interval 1 menit (playbook OFFLINE/PWA).
    if (!isReady || user === null) return
    return startSyncTriggers()
  }, [isReady, user])

  if (!isReady) {
    return <div className="min-h-dvh bg-surface" aria-busy="true" />
  }

  const isPublic = path === '/login' || path === '/register'
  if (user === null) {
    if (isPublic) {
      const matched = matchRoute(PUBLIC_ROUTES, path)
      if (matched !== null) {
        return matched.config.component({ path: matched.config.path, param: matched.param })
      }
    }
    return <NavigateStub target="/login" />
  }

  if (isPublic) return <NavigateStub target="/" />

  const matched = matchRoute(SECURE_ROUTES, path)
  if (matched === null) return <NavigateStub target="/" />
  // Guard admin: collector dialihkan ke Beranda (otorisasi sesungguhnya di server).
  if (matched.config.adminOnly === true && !user.roles.includes('admin')) {
    return <NavigateStub target="/" />
  }

  return (
    <AppLayout>
      {matched.config.component({ path: matched.config.path, param: matched.param })}
    </AppLayout>
  )
}
