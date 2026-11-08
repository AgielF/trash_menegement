import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { fetchOutstanding, type AddPaymentBody } from './api'
import { getKasbonHouse, getPaymentHistory, savePayment } from './service'
import type { PaymentHistoryItem } from './service'
import type { AddPaymentResponse, OutstandingRow } from './schemas'

export interface KasbonHouseInfo {
  ownerName: string
  rt: string
  gang: string
}

export function useKasbon(houseId: string): {
  rows: readonly OutstandingRow[]
  loading: boolean
  offline: boolean
  error: string | null
  house: KasbonHouseInfo | null
  history: readonly PaymentHistoryItem[]
  historyLoading: boolean
  refresh: () => Promise<void>
  recordPayment: (body: AddPaymentBody, note: string | undefined) => Promise<AddPaymentResponse>
} {
  const [rows, setRows] = useState<readonly OutstandingRow[]>([])
  const [loadedHouseId, setLoadedHouseId] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [house, setHouse] = useState<KasbonHouseInfo | null>(null)
  const [history, setHistory] = useState<readonly PaymentHistoryItem[]>([])
  const [historyHouseId, setHistoryHouseId] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const remote = await fetchOutstanding(houseId)
      setRows(remote)
      setOffline(false)
      setError(null)
    } catch (caught: unknown) {
      if (!(caught instanceof ApiError)) {
        setError('Terjadi galat tak terduga.')
      } else if (caught.status === null) {
        setOffline(true)
      } else {
        setError(caught.message)
      }
    }
    setLoadedHouseId(houseId)
  }, [houseId])

  useEffect(() => {
    const cancelled = { value: false }
    void getKasbonHouse(houseId)
      .then((result) => {
        if (!cancelled.value) setHouse(result)
      })
      .catch(() => {
        if (!cancelled.value) setHouse(null)
      })
    void getPaymentHistory(houseId)
      .then((result) => {
        if (!cancelled.value) {
          setHistory(result)
          setHistoryHouseId(houseId)
        }
      })
      .catch(() => {
        if (!cancelled.value) {
          setHistory([])
          setHistoryHouseId(houseId)
        }
      })
    void (async () => {
      try {
        const remote = await fetchOutstanding(houseId)
        if (!cancelled.value) {
          setRows(remote)
          setOffline(false)
          setError(null)
        }
      } catch (caught: unknown) {
        if (!cancelled.value) {
          if (!(caught instanceof ApiError)) {
            setError('Terjadi galat tak terduga.')
          } else if (caught.status === null) {
            setOffline(true)
          } else {
            setError(caught.message)
          }
        }
      } finally {
        if (!cancelled.value) setLoadedHouseId(houseId)
      }
    })()
    return () => {
      cancelled.value = true
    }
  }, [houseId])

  return {
    rows,
    loading: loadedHouseId !== houseId,
    offline,
    error,
    house,
    history,
    historyLoading: historyHouseId !== houseId,
    refresh,
    recordPayment: savePayment,
  }
}
