import { useEffect } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { configureHttp } from '@/shared/api/http'
import { startSyncTriggers } from '@/features/sync/service'
import { AppLayout } from './AppLayout'
import { ToastProvider } from '@/shared/components/ui/Toast'
import { APP_PATHS, APP_ROUTES, type AppRoute } from '@/config/routes'

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

export function App(): React.ReactElement {
  const { hydrate, isReady, user } = useAuthStore()
  const routeElement = useRoutes(
    APP_ROUTES.map((route) => ({
      path: route.path,
      element: <RouteView route={route} />,
    })),
  )

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

  return <ToastProvider>{routeElement}</ToastProvider>
}

function RouteView({ route }: { route: AppRoute }): React.ReactElement {
  const user = useAuthStore((state) => state.user)

  if (route.public === true) {
    return user === null ? route.element : <Navigate to={APP_PATHS.home} replace />
  }
  if (user === null) return <Navigate to={APP_PATHS.login} replace />
  if (route.requiredRole !== undefined && !user.roles.includes(route.requiredRole)) {
    return <Navigate to={APP_PATHS.home} replace />
  }

  return <AppLayout>{route.element}</AppLayout>
}
