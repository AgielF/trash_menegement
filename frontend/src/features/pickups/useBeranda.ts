import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { useToast } from '@/shared/components/ui/toast-constants'
import {
  pushLocalSnapshot,
  refreshPendingCount,
  runPull,
  runPush,
  useSyncStore,
} from '@/features/sync/service'
import {
  cacheTodayRows,
  fetchStats,
  fetchToday,
  gatherBeranda,
  startDayOnline,
  type BerandaSnapshot,
} from './service'
import type { StatsResponse } from './schemas'

export function useBeranda(): {
  stats: StatsResponse | null
  local: BerandaSnapshot | null
  offline: boolean
  loading: boolean
  starting: boolean
  startError: string | null
  syncing: boolean
  pendingCount: number | null
  startDay: () => Promise<boolean>
  sync: () => Promise<void>
} {
  const { showToast } = useToast()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [local, setLocal] = useState<BerandaSnapshot | null>(null)
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    const cancelled = { value: false }
    void (async () => {
      let isOffline = false
      try {
        const remote = await fetchToday()
        await cacheTodayRows(remote)
      } catch (error) {
        isOffline = !(error instanceof ApiError && error.status !== null)
      }
      if (!isOffline) {
        try {
          const response = await fetchStats('today')
          if (!cancelled.value) setStats(response)
        } catch (error) {
          if (!(error instanceof ApiError && error.status !== null) && !cancelled.value) {
            setStats(null)
          }
        }
      }
      const snapshot = await gatherBeranda()
      if (cancelled.value) return
      setOffline(isOffline)
      setLocal(snapshot)
      setLoading(false)
    })()
    void refreshPendingCount().then((count) => {
      if (!cancelled.value) setPendingCount(count)
    })
    return () => {
      cancelled.value = true
    }
  }, [])

  async function startDay(): Promise<boolean> {
    setStartError(null)
    setStarting(true)
    try {
      await startDayOnline()
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === null) {
        setStartError('Tidak dapat terhubung ke server. Pastikan Anda online.')
      } else {
        setStartError(error instanceof ApiError ? error.message : 'Gagal memulai hari.')
      }
      return false
    } finally {
      setStarting(false)
    }
  }

  async function sync(): Promise<void> {
    setSyncing(true)
    try {
      await runPush()
      const pushed = await pushLocalSnapshot()
      await runPull()
      const count = await refreshPendingCount()
      setPendingCount(count)
      const conflictCount =
        pushed.houseConflicts.length +
        pushed.pickupConflicts.length +
        pushed.paymentConflicts.length
      const syncError = useSyncStore.getState().lastError
      if (syncError !== null) {
        showToast(syncError, 'warning')
      } else if (conflictCount > 0) {
        showToast(`Sinkronisasi selesai dengan ${conflictCount.toString()} konflik.`, 'warning')
      } else {
        showToast(
          count > 0 ? `${count.toString()} data masih menunggu sinkron.` : 'Sinkronisasi selesai.',
          'success',
        )
      }
    } catch {
      showToast('Sinkronisasi gagal.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  return {
    stats,
    local,
    offline,
    loading,
    starting,
    startError,
    syncing,
    pendingCount,
    startDay,
    sync,
  }
}
