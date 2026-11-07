import { useEffect, useMemo, useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { ApiError } from '@/shared/api/http'
import {
  cacheTodayRows,
  fetchToday,
  listTodayFromDb,
  recordPickup,
  skipPickup,
  listPendingPickupIds,
  todayKey,
} from './service'
import { HouseCard } from './HouseCard'
import { TextField } from '@/shared/components/ui/TextField'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/components/ui/toast-constants'
import { formatWibDateLabel } from '@/shared/lib/date'

/**
 * F6/F7/F8 — Daftar Rumah petugas:
 * - Data: GET /pickups/today (kontrak resmi) dipakai
 *   saat daring; respons di-cache ke Dexie. Saat offline → dibaca dari Dexie.
 * - Kartu: warna status dari config/status.ts (abu/hijau/merah/kuning/koral).
 * - F7: klik kartu → dialog isi jumlah karung → PATCH /pickups/:id/pickup.
 * - F8: tombol Skip pada kartu belum diambil → dialog alasan wajib →
 *   POST /pickups/:id/skip. Keduanya offline-first (Dexie + outbox).
 */
export function HouseListPage(): React.ReactElement {
  const [rows, setRows] = useState<PickupRow[]>([])
  const [pendingRecordIds, setPendingRecordIds] = useState<ReadonlySet<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [actionRecord, setActionRecord] = useState<PickupRow | null>(null)
  const [skipRecord, setSkipRecord] = useState<PickupRow | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const remote = await fetchToday()
        await cacheTodayRows(remote)
        setOffline(false)
      } catch (error) {
        // Gagal-request dianggap offline (playbook); data dari Dexie.
        setOffline(!(error instanceof ApiError && error.status !== null))
      }
      const [todayRows, pendingIds] = await Promise.all([listTodayFromDb(), listPendingPickupIds()])
      setRows(todayRows)
      setPendingRecordIds(pendingIds)
      setLoading(false)
    })()
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

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] bg-surface">
      <header className="rounded-b-3xl bg-brand px-5 pt-3 pb-4">
        <div className="flex items-center justify-end">
          <span className="text-[9px] font-bold tracking-wide text-white">BERSHIKU</span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder="CARI..."
            aria-label="Cari rumah"
            className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:font-medium placeholder:text-neutral-400"
          />
        </div>
      </header>

      <main className="flex flex-col gap-3 px-4 py-4">
        {offline ? (
          <p
            role="status"
            className="mx-auto w-fit rounded-full bg-white px-4 py-1 text-xs font-medium text-neutral-700 shadow-sm"
          >
            Offline — perubahan tersimpan lokal, menunggu sinkron
          </p>
        ) : null}
        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Belum ada rumah hari ini. Coba mulai hari lewat tombol Mulai Ambil Sampah di Beranda.
          </p>
        ) : (
          filtered.map((row) => {
            const skippedToday = row.skips.some((skip) => skip.skipDate === todayKey())
            return (
              <div key={row.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDialogError(null)
                    setActionRecord(row)
                  }}
                  aria-label={`Buka detail pengambilan ${row.house.ownerName}`}
                  className="w-full text-left focus-visible:ring-2 focus-visible:ring-action"
                >
                  <HouseCard
                    house={{
                      id: row.id,
                      ownerName: row.house.ownerName,
                      rt: row.house.rt,
                      gang: row.house.gang,
                      pickupStatus: row.pickupStatus,
                      paymentStatus: row.paymentStatus,
                      skippedToday,
                      pendingSync: pendingRecordIds.has(row.id),
                    }}
                  />
                </button>
                {row.pickupStatus === 'belum_diambil' && !skippedToday ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDialogError(null)
                      setSkipRecord(row)
                    }}
                    className="absolute right-3 bottom-2.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm focus-visible:ring-2 focus-visible:ring-action"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
            )
          })
        )}
      </main>

      {actionRecord !== null ? (
        <PickupDialog
          key={`pickup-${actionRecord.id}`}
          record={actionRecord}
          onClose={() => {
            setActionRecord(null)
          }}
          onDone={() => {
            void refresh()
          }}
          onErrorSetter={setDialogError}
          error={dialogError}
        />
      ) : null}
      {skipRecord !== null ? (
        <SkipDialog
          key={`skip-${skipRecord.id}`}
          record={skipRecord}
          onClose={() => {
            setSkipRecord(null)
          }}
          onDone={() => {
            void refresh()
          }}
          onErrorSetter={setDialogError}
          error={dialogError}
        />
      ) : null}
    </div>
  )
}

interface DialogBaseProps {
  record: PickupRow
  onClose: () => void
  onDone: () => void
  onErrorSetter: (message: string | null) => void
  error: string | null
}

/** Modal bawah berbagi bingkai (latar klik-tutup + kartu putih membulat). */
function QDialog({
  title,
  subtitle,
  onClose,
  error,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  error: string | null
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-20 flex items-end bg-black/40 p-4"
    >
      {/* Latar klik-tutup: button penuh agar patuh a11y (bisa difokus & Enter). */}
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full rounded-3xl bg-white p-5 shadow-lg">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        <p className="text-xs text-neutral-600">{subtitle}</p>
        {error !== null ? (
          <p role="alert" className="mt-2 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

/** F7 — Catat pengambilan: jumlah karung (int ≥ 0) → PATCH /pickups/:id/pickup. */
function PickupDialog({
  record,
  onClose,
  onDone,
  onErrorSetter,
  error,
}: DialogBaseProps): React.ReactElement {
  const [bagsCount, setBagsCount] = useState(
    record.bagsCount !== null ? String(record.bagsCount) : '1',
  )
  const [busy, setBusy] = useState(false)
  const { showToast } = useToast()

  const isPicked = record.pickupStatus === 'sudah_diambil'

  async function confirmPickup(): Promise<void> {
    const parsed = Number.parseInt(bagsCount, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      onErrorSetter('Jumlah karung harus berupa angka 0 atau lebih.')
      return
    }
    setBusy(true)
    try {
      // Offline-first: tulis Dexie → antre outbox; server penentu saat sinkron.
      await recordPickup(record, parsed)
      onDone()
      onClose()
      showToast(`Pengambilan ${parsed.toString()} karung tercatat.`, 'success')
    } catch (caught: unknown) {
      onErrorSetter(caught instanceof Error ? caught.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <QDialog
      title={record.house.ownerName}
      subtitle={`RT ${record.house.rt} · Gang ${record.house.gang} · Jatuh tempo ${formatWibDateLabel(new Date(record.dueDate))}`}
      onClose={onClose}
      error={error}
    >
      {isPicked ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Sudah diambil ({record.bagsCount ?? '—'} karung). Pembayaran dicatat di layar
            Kasbon/Uang.
          </p>
          <Button label="Tutup" variant="pill-green" onClick={onClose} />
        </div>
      ) : (
        <div className="space-y-4">
          <TextField
            name="bagsCount"
            label="Jumlah karung"
            type="text"
            showLabel
            value={bagsCount}
            onChange={(value) => {
              setBagsCount(value)
            }}
          />
          <Button
            label="Simpan Pengambilan"
            variant="pill-green"
            loading={busy}
            onClick={() => {
              void confirmPickup()
            }}
          />
        </div>
      )}
    </QDialog>
  )
}

/** F8 — Skip: alasan WAJIB (aturan bisnis) → POST /pickups/:id/skip (upsert per hari). */
function SkipDialog({
  record,
  onClose,
  onDone,
  onErrorSetter,
  error,
}: DialogBaseProps): React.ReactElement {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { showToast } = useToast()

  async function confirmSkip(): Promise<void> {
    if (reason.trim() === '') {
      onErrorSetter('Alasan skip wajib diisi (aturan bisnis).')
      return
    }
    setBusy(true)
    try {
      // Offline-first: tulis Dexie → antre outbox (id client = clientRef, aman diulang).
      await skipPickup(record, reason.trim())
      onDone()
      onClose()
      showToast('Rumah di-skip hari ini.', 'info')
    } catch (caught: unknown) {
      onErrorSetter(caught instanceof Error ? caught.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <QDialog
      title={record.house.ownerName}
      subtitle={`RT ${record.house.rt} · Gang ${record.house.gang} · Skip hari ini wajib beralasan`}
      onClose={onClose}
      error={error}
    >
      <div className="space-y-4">
        <TextField
          name="skipReason"
          label="Alasan skip"
          value={reason}
          onChange={(value) => {
            setReason(value)
          }}
          showLabel
        />
        <Button
          label="Simpan Skip"
          variant="pill-green"
          loading={busy}
          onClick={() => {
            void confirmSkip()
          }}
        />
      </div>
    </QDialog>
  )
}
