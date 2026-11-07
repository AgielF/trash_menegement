import { useEffect } from 'react'
import { navigate } from '@/shared/lib/router'

/** Pengganti <Navigate> (tanpa dependensi router): pindahkan saat mount. */
export function NavigateStub({ target }: { target: string }): React.ReactElement {
  useEffect(() => {
    navigate(target)
  }, [target])
  return <div className="min-h-dvh bg-surface" aria-busy="true" />
}
