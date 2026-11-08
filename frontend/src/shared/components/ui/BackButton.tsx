import { ArrowLeft } from 'lucide-react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { APP_ROUTES, type AppRole } from '@/config/routes'

export function BackButton({ role = 'collector' }: { role?: AppRole }): React.ReactElement | null {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const route = APP_ROUTES.find(
    (item) => item.parentPath !== undefined && matchPath({ path: item.path, end: true }, pathname),
  )

  if (route?.parentPath === undefined) return null
  const parentPath = route.parentPath
  const destination = typeof parentPath === 'string' ? parentPath : parentPath[role]
  if (destination === undefined) return null
  const parentDestination = destination

  function goToParent(): void {
    void navigate(parentDestination)
  }

  return (
    <button
      type="button"
      onClick={goToParent}
      aria-label="Kembali"
      title="Kembali"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
    >
      <ArrowLeft aria-hidden="true" className="h-5 w-5" />
    </button>
  )
}
