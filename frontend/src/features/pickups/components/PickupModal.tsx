import { useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { Button } from '@/shared/components/ui/Button'
import { Dialog } from '@/shared/components/ui/Dialog'
import { TextField } from '@/shared/components/ui/TextField'
import { useToast } from '@/shared/components/ui/toast-constants'
import { formatWibDateLabel } from '@/shared/lib/date'

export const QDialog = Dialog

interface DialogBaseProps {
  record: PickupRow
  onClose: () => void
  onDone: () => void
  onErrorSetter: (message: string | null) => void
  error: string | null
}

export interface PickupModalProps extends DialogBaseProps {
  recordPickup: (record: PickupRow, bagsCount: number) => Promise<PickupRow>
}

/** F7 — Catat pengambilan: jumlah karung (int ≥ 0). */
export function PickupModal({
  record,
  recordPickup,
  onClose,
  onDone,
  onErrorSetter,
  error,
}: PickupModalProps): React.ReactElement {
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
    <Dialog
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
    </Dialog>
  )
}
