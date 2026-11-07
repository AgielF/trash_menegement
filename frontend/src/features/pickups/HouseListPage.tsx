import { useEffect, useMemo, useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { todayKey, recordPickup, skipPickup, listTodayFromDb } from './service'
import { HouseCard } from './HouseCard'
import { TextField } from '@/shared/components/ui/TextField'
import { Button } from '@/shared/components/ui/Button'

/**
 * Daftar Rumah — persis WhatsApp Image referensi (panel kanan):
 * header hijau dengan kolom cari "CARI...", kartu-kartu status berwarna.
 * Aksi ambil/skip lewat dialog bawah (kebutuhan scope, gaya konsisten referensi).
 */
export function HouseListPage(): React.ReactElement {
  const [rows, setRows] = useState<PickupRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionRecord, setActionRecord] = useState<PickupRow | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh(): Promise<void> {
    setLoading(true)
    setRows(await listTodayFromDb())
    setLoading(false)
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
      <header className="rounded-b-3xl bg-brand px-5 pt-4 pb-5">
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
        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Belum ada rumah hari ini. Coba buat jadwal lewat tombol Mulai Ambil Sampah di Beranda.
          </p>
        ) : (
          filtered.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                setDialogError(null)
                setActionRecord(row)
              }}
              className="text-left"
            >
              <HouseCard
                house={{
                  id: row.id,
                  ownerName: row.house.ownerName,
                  rt: row.house.rt,
                  gang: row.house.gang,
                  pickupStatus: row.pickupStatus,
                  paymentStatus: row.paymentStatus,
                  skippedToday: row.skips.some((skip) => skip.skipDate === todayKey()),
                }}
              />
            </button>
          ))
        )}
      </main>

      {actionRecord !== null ? (
        <ActionDialog
          key={actionRecord.id}
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
    </div>
  )
}

interface ActionDialogProps {
  record: PickupRow
  onClose: () => void
  onDone: () => void
  onErrorSetter: (message: string | null) => void
  error: string | null
}

/**
 * Dialog aksi (di luar mockup — kebutuhan alur ambil/skip):
 * rumah belum diambil → isi jumlah karung ATAU isi alasan skip.
 * rumah sudah diambil → tombol tutup (bayar menyusul di Iris 4).
 */
function ActionDialog({
  record,
  onClose,
  onDone,
  onErrorSetter,
  error,
}: ActionDialogProps): React.ReactElement {
  const [bagsCount, setBagsCount] = useState('1')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const today = todayKey()
  const skippedToday = record.skips.some((skip) => skip.skipDate === today)
  const isPicked = record.pickupStatus === 'sudah_diambil'

  async function onConfirmPickup(): Promise<void> {
    const parsed = Number.parseInt(bagsCount, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      onErrorSetter('Jumlah karung harus berupa angka 0 atau lebih.')
      return
    }
    setBusy(true)
    try {
      await recordPickup(record, parsed)
      onDone()
      onClose()
    } catch (caught: unknown) {
      onErrorSetter(caught instanceof Error ? caught.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmSkip(): Promise<void> {
    if (reason.trim() === '') {
      onErrorSetter('Alasan skip wajib diisi (aturan bisnis).')
      return
    }
    setBusy(true)
    try {
      await skipPickup(record, reason.trim())
      onDone()
      onClose()
    } catch (caught: unknown) {
      onErrorSetter(caught instanceof Error ? caught.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Aksi untuk ${record.house.ownerName}`}
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
        <h2 className="text-base font-bold text-neutral-900">{record.house.ownerName}</h2>
        <p className="text-xs text-neutral-600">
          RT {record.house.rt} · Gang {record.house.gang} · Jatuh tempo {record.dueDate}
        </p>

        {error !== null ? (
          <p role="alert" className="mt-2 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}

        {isPicked ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-neutral-700">
              Sudah diambil ({record.bagsCount ?? '—'} karung). Pembayaran menyusul di layar Uang
              (Iris 4).
            </p>
            <Button label="Tutup" variant="pill-green" onClick={onClose} />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1 px-1 text-xs font-semibold text-neutral-700">Ambil sampah</p>
              <TextField
                name="bagsCount"
                label="Jumlah karung"
                type="text"
                showLabel={false}
                value={bagsCount}
                onChange={(value) => {
                  setBagsCount(value)
                }}
              />
              <Button
                label={skippedToday ? 'Ambil sekarang' : 'Ambil'}
                variant="pill-green"
                loading={busy}
                onClick={() => {
                  void onConfirmPickup()
                }}
              />
            </div>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold text-neutral-700">
                Skip (wajib alasan)
              </p>
              <TextField
                name="skipReason"
                label="Alasan skip"
                value={reason}
                onChange={(value) => {
                  setReason(value)
                }}
              />
              <Button
                label="Skip"
                variant="pill-green"
                loading={busy}
                onClick={() => {
                  void onConfirmSkip()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
