import { useEffect, useState } from 'react'
import { listKasbonHouses } from './service'
import type { KasbonHouse } from './aggregate'

export function useKasbonList(): {
  houses: readonly KasbonHouse[]
  loading: boolean
} {
  const [houses, setHouses] = useState<readonly KasbonHouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void listKasbonHouses()
      .then((result) => {
        if (active) setHouses(result)
      })
      .catch(() => {
        if (active) setHouses([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { houses, loading }
}
