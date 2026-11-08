import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { fetchStats } from '@/features/pickups/service'
import type { StatsRange, StatsResponse } from '@/features/pickups/schemas'
import { getLocalIncomeSummary, todayWibKey, type PaymentHistoryItem } from './service'

export function useUang(): {
  range: StatsRange
  changeRange: (range: StatsRange) => void
  stats: StatsResponse | null
  offline: boolean
  localMoney: number | null
  history: readonly PaymentHistoryItem[]
  loading: boolean
} {
  const [range, setRange] = useState<StatsRange>('today')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [offline, setOffline] = useState(false)
  const [localMoney, setLocalMoney] = useState<number | null>(null)
  const [history, setHistory] = useState<readonly PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const changeRange = useCallback((nextRange: StatsRange): void => {
    setRange(nextRange)
    setStats(null)
    setLocalMoney(null)
    setLoading(true)
  }, [])

  useEffect(() => {
    const cancelled = { value: false }
    void (async () => {
      let localSummary: Awaited<ReturnType<typeof getLocalIncomeSummary>> | null = null
      try {
        const response = await fetchStats(range)
        if (!cancelled.value) {
          setStats(response)
          setOffline(false)
        }
      } catch (error) {
        if (!cancelled.value) {
          setStats(null)
          setOffline(!(error instanceof ApiError && error.status !== null))
        }
        if (range === 'today') {
          localSummary = await getLocalIncomeSummary(todayWibKey())
          if (!cancelled.value) setLocalMoney(localSummary.amount)
        }
      }

      if (range === 'today') {
        localSummary ??= await getLocalIncomeSummary(todayWibKey())
        if (!cancelled.value) setHistory(localSummary.history)
      } else if (!cancelled.value) {
        setHistory([])
      }
      if (!cancelled.value) setLoading(false)
    })()

    return () => {
      cancelled.value = true
    }
  }, [range])

  return { range, changeRange, stats, offline, localMoney, history, loading }
}
