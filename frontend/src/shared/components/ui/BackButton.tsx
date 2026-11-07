import { ArrowLeft } from 'lucide-react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { ROUTE_HIERARCHY } from '@/config/route-hierarchy'

export function BackButton(): React.ReactElement | null {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const parentRoute = ROUTE_HIERARCHY.find((route) =>
    matchPath({ path: route.pattern, end: true }, pathname),
  )

  if (parentRoute === undefined) return null
  const destination = parentRoute.destination

  function goToParent(): void {
    void navigate(destination)
    // The existing application router also subscribes to hashchange events.
    // React Router updates the hash with pushState, which does not emit one itself.
    window.dispatchEvent(new Event('hashchange'))
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
