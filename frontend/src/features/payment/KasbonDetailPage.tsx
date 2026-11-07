import { useEffect, useState } from 'react'
import { db } from '@/shared/db/db'
import type { PickupRow } from '@/shared/db/db'
import { ApiError } from '@/shared/api/http'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { PlaceholderAvatar } from '@/shared/components/ui/Placeholder'
import { Button } from '@/shared/components/ui/Button'
import { TextField } from '@/shared/components/ui/TextField'
import { addPayment, fetchOutstanding } from './api'
import { clampToSisa, exceedsSisa, formatRupiah } from './clamp'
import type { OutstandingRow, AddPaymentResponse } from './schemas'

/** Petakan paymentStatus ke label teks (dilarang hanya lewat warna — WCAG). */
function statusLabel(status: OutstandingRow['paymentStatus']): string {
  switch (status) {
    case 'belum_bayar':
      return 'Belum bayar'
    case 'sebagian':
      return 'Bayar sebagian'
    case 'lunas':
      return 'Lunas'
  }
}

/** Simpan hasil pembayaran ke Dexie (offline cache untuk Uang & estimasi kasbon). */
async function cachePaymentResult(
  response: AddPaymentResponse,
  note: string | undefined,
): Promise<void> {
  const { payment, record } = response
  await db.payments.put({
    id: payment.id,
    recordId: payment.recordId,
    receivedBy: payment.receivedBy,
    amount: payment.amount,
    paidAt: payment.paidAt,
    note: note === '' ? null : (note ?? null),
    voidedAt: null,
    updatedAt: payment.updatedAt,
  })
  const local = await db.pickups.get(record.id)
  if (local !== undefined) {
    const updatedPickup: PickupRow = {
      ...local,
      paymentStatus: record.paymentStatus,
      updatedAt: record.updatedAt,
    }
    await db.pickups.put(updatedPickup)
  } else {
    // Record belum ada lokal (dibuat server lama): simpan minimal tanpa relasi house.
    await db.pickups.put({
      id: record.id,
      houseId: record.houseId,
      collectorId: record.collectorId,
      dueDate: record.dueDate,
      pickupStatus: record.pickupStatus,
      pickedAt: record.pickedAt,
      bagsCount: record.bagsCount,
      feeAmount: record.feeAmount,
      paymentStatus: record.paymentStatus,
      house: { id: record.houseId, ownerName: '', rt: '', gang: '', addressNote: null },
      skips: [],
      updatedAt: record.updatedAt,
    })
  }
}

interface PaymentSectionProps {
  houseId: string
  ownerName: string | null
}

/** F13 — Detail kasbon rumah: daftar record (sisa > 0) + form pelunasan. */
export function KasbonDetailPage({ houseId, ownerName }: PaymentSectionProps): React.ReactElement {
  const [rows, setRows] = useState<readonly OutstandingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [house, setHouse] = useState<{ ownerName: string; rt: string; gang: string } | null>(null)

  async function refresh(): Promise<void> {
    try {
      const remote = await fetchOutstanding(houseId)
      setRows(remote)
      setOffline(false)
      setError(null)
    } catch (caught: unknown) {
      if (!(caught instanceof ApiError)) {
        setError('Terjadi galat tak terduga.')
      } else if (caught.status === null) {
        // Gagal-request = dianggap offline (playbook); fallback Dexie.
        setOffline(true)
      } else {
        setError(caught.message)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      const local = await db.houses.get(houseId)
      setHouse(
        local !== undefined ? { ownerName: local.ownerName, rt: local.rt, gang: local.gang } : null,
      )
      await refresh()
    })()
    // refresh didefinisikan stable di atas (tidak pakai dep state).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId])

  const headerName = ownerName ?? house?.ownerName ?? 'Kasbon Rumah'

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <div className="flex items-center gap-2">
          <PlaceholderAvatar />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{headerName}</h1>
            <p className="text-xs font-medium">Kasbon — tagihan belum lunas</p>
          </div>
        </div>
      </CurvedHeader>

      <section className="relative -mt-6 rounded-tl-[2.5rem] bg-surface px-5 pt-6">
        {offline ? (
          <p
            role="status"
            className="mb-3 rounded-xl bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm"
          >
            Offline — daftar menampilkan data lokal, memuat pembayaran butuh daring.
          </p>
        ) : null}
        {error !== null ? (
          <p role="alert" className="mb-3 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-neutral-600 shadow-sm">
            Tidak ada tagihan belun lunas untuk rumah ini.
          </p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Daftar tagihan kasbon">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-700">
                      Jatuh tempo {formatWibDateTimeLabel(row.dueDate)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-900">
                      {formatRupiah(row.feeAmount)} · dibayar {formatRupiah(row.paid)}
                    </p>
                    <p
                      className={`text-xs font-semibold ${row.paymentStatus === 'belum_bayar' ? 'text-status-kasbon' : 'text-amber-700'}`}
                    >
                      {statusLabel(row.paymentStatus)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500">Sisa</p>
                    <p className="text-lg font-extrabold text-brand">{formatRupiah(row.sisa)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 ? (
          <PaymentForm
            // Key ber-konten: daftar berubah (hapus record lunas) → form remount bersih
            // (tanpa effect yang memanggil setState — aturan react-hooks/set-state-in-effect).
            key={rows.map((row) => row.id).join(',')}
            rows={rows}
            onPaid={() => {
              void refresh()
            }}
          />
        ) : null}
      </section>
    </div>
  )
}

/** "17 Okt 2026" dari ISO tanggal (aman utk tanggal 'YYYY-MM-DD' atau ISO penuh). */
function formatWibDateTimeLabel(iso: string): string {
  const date = new Date(iso)
  return formatWibDayLabel(date)
}

function formatWibDayLabel(date: Date): string {
  const label = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  return label
}

interface PaymentFormProps {
  rows: readonly OutstandingRow[]
  onPaid: () => void
}

/** Form pelunasan (F13): pilih catatan, nominal ≤ sisa, catatan opsional. */
function PaymentForm({ rows, onPaid }: PaymentFormProps): React.ReactElement {
  const [recordId, setRecordId] = useState(rows[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = rows.find((line) => line.id === recordId) ?? null

  async function submit(): Promise<void> {
    setError(null)
    setNotice(null)
    if (selected === null) {
      setError('Pilih catatan yang ingin dibayar.')
      return
    }
    const parsed = Number.parseInt(amount, 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      setError('Nominal harus bilangan bulat minimal Rp 1.')
      return
    }
    const finalAmount = clampToSisa(parsed, selected.sisa)
    setBusy(true)
    try {
      const response = await addPayment({
        recordId: selected.id,
        amount: finalAmount,
        note: note.trim() === '' ? undefined : note.trim(),
      })
      await cachePaymentResult(response, note)
      if (response.payment.clamped || exceedsSisa(parsed, selected.sisa)) {
        setNotice(
          `Uang yang dicatat dibatasi menjadi ${formatRupiah(response.payment.amount)} (permintaan ${formatRupiah(response.payment.requestedAmount)}) sesuai sisa tagihan.`,
        )
      } else {
        setNotice(
          `Pembayaran ${formatRupiah(response.payment.amount)} tercatat. Sisa tagihan: ${formatRupiah(response.remaining)}.`,
        )
      }
      setAmount('')
      setNote('')
      onPaid()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === null) {
        setError('Masih offline — pembayaran butuh koneksi (server menentukan clamp akhir).')
      } else {
        setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="mt-6 rounded-3xl bg-white p-5 shadow-sm"
      noValidate
    >
      <h2 className="text-base font-bold text-neutral-900">Bayar Kasbon</h2>

      <label
        htmlFor="payment-record"
        className="mt-3 block px-1 text-xs font-semibold text-neutral-700"
      >
        Catatan yang dibayar
      </label>
      <select
        id="payment-record"
        value={recordId}
        onChange={(event) => {
          setRecordId(event.target.value)
          setAmount('')
        }}
        className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus-visible:ring-2 focus-visible:ring-action"
      >
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {formatWibDayLabel(new Date(row.dueDate))} — sisa {formatRupiah(row.sisa)}
          </option>
        ))}
      </select>

      <div className="mt-3">
        <TextField
          name="paymentAmount"
          label={`Nominal (maks ${selected !== null ? formatRupiah(selected.sisa) : '—'})`}
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(value) => {
            setAmount(value)
          }}
          showLabel
        />
        {selected !== null &&
        amount !== '' &&
        !Number.isNaN(Number.parseInt(amount, 10)) &&
        exceedsSisa(Number.parseInt(amount, 10), selected.sisa) ? (
          <p className="mt-1 px-5 text-xs text-amber-700" role="note">
            Nominal melebihi sisa — akan dibatasi server menjadi{' '}
            {formatRupiah(clampToSisa(Number.parseInt(amount, 10), selected.sisa))}.
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        <TextField
          name="paymentNote"
          label="Catatan (opsional)"
          value={note}
          onChange={(value) => {
            setNote(value)
          }}
          showLabel
        />
      </div>

      {notice !== null ? (
        <p role="status" className="mt-3 text-xs font-medium text-brand">
          {notice}
        </p>
      ) : null}
      {error !== null ? (
        <p role="alert" className="mt-3 text-xs text-status-kasbon">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button label="Simpan Pembayaran" type="submit" loading={busy} />
      </div>
    </form>
  )
}
