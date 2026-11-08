import { useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { SelectField } from '@/shared/components/ui/SelectField'
import { TextField } from '@/shared/components/ui/TextField'
import type { AddPaymentBody } from '../api'
import { clampToSisa, exceedsSisa, formatRupiah } from '../clamp'
import type { AddPaymentResponse, OutstandingRow } from '../schemas'
import { formatWibDayLabel } from '../format'

interface PaymentFormProps {
  rows: readonly OutstandingRow[]
  onSave: (body: AddPaymentBody, note: string | undefined) => Promise<AddPaymentResponse>
  onPaid: () => void
}

/** Form pelunasan (F13): pilih catatan, nominal ≤ sisa, catatan opsional. */
export function PaymentForm({ rows, onSave, onPaid }: PaymentFormProps): React.ReactElement {
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
      const response = await onSave(
        {
          recordId: selected.id,
          amount: finalAmount,
          note: note.trim() === '' ? undefined : note.trim(),
        },
        note,
      )
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
        setError('Pembayaran membutuhkan koneksi internet. Pastikan Anda online.')
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

      <SelectField
        label="Catatan yang dibayar"
        name="payment-record"
        value={recordId}
        onChange={(value) => {
          setRecordId(value)
          setAmount('')
        }}
        className="mt-3"
      >
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {formatWibDayLabel(new Date(row.dueDate))} — sisa {formatRupiah(row.sisa)}
          </option>
        ))}
      </SelectField>

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
