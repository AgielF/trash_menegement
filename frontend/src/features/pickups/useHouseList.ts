import { useEffect, useMemo, useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { ApiError } from '@/shared/api/http'
import {
  cacheTodayRows,
  fetchToday,
  listPendingPickupIds,
  listTodayFromDb,
  recordPickup as savePickup,
  skipPickup as saveSkip,
} from './service'

export function useHouseList(): {
  rows: readonly PickupRow[]
  filtered: readonly PickupRow[]
  pendingRecordIds: ReadonlySet<string>
  query: string
  setQuery: (query: string) => void
  loading: boolean
  offline: boolean
  refresh: () => Promise<void>
  recordPickup: typeof savePickup
  skipPickup: typeof saveSkip
} {
  const [rows, setRows] = useState<PickupRow[]>([])
  const [pendingRecordIds, setPendingRecordIds] = useState<ReadonlySet<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const cancelled = { value: false }
    void (async () => {
      try {
        const remote = await fetchToday()
        await cacheTodayRows(remote)
        if (!cancelled.value) setOffline(false)
      } catch (error) {
        if (!cancelled.value) setOffline(!(error instanceof ApiError && error.status !== null))
      }
      const [todayRows, pendingIds] = await Promise.all([listTodayFromDb(), listPendingPickupIds()])
      if (cancelled.value) return
      setRows(todayRows)
      setPendingRecordIds(pendingIds)
      setLoading(false)
    })()
    return () => {
      cancelled.value = true
    }
  }, [])

  async function refresh(): Promise<void> {
    const [todayRows, pendingIds] = await Promise.all([listTodayFromDb(), listPendingPickupIds()])
    setRows(todayRows)
    setPendingRecordIds(pendingIds)
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return rows
    return rows.filter(
      (row) =>
        row.house.ownerName.toLowerCase().includes(needle) ||
        `rt ${row.house.rt}`.toLowerCase().includes(needle) ||
        `gang ${row.house.gang}`.toLowerCase().includes(needle),
    )
  }, [rows, query])

  return {
    rows,
    filtered,
    pendingRecordIds,
    query,
    setQuery,
    loading,
    offline,
    refresh,
    recordPickup: savePickup,
    skipPickup: saveSkip,
  }
}
