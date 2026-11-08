import { useState } from 'react'
import type { PickupRow } from '@/shared/db/db'
import { Button } from '@/shared/components/ui/Button'
import { Dialog } from '@/shared/components/ui/Dialog'
import { TextField } from '@/shared/components/ui/TextField'
import { useToast } from '@/shared/components/ui/toast-constants'

export interface SkipModalProps {
  record: PickupRow
  skipPickup: (record: PickupRow, reason: string) => Promise<PickupRow>
  onClose: () => void
  onDone: () => void
  onErrorSetter: (message: string | null) => void
  error: string | null
}

/** F8 — Skip: alasan wajib, disimpan offline-first dan disinkronkan kemudian. */
export function SkipModal({
  record,
  skipPickup,
  onClose,
  onDone,
  onErrorSetter,
  error,
}: SkipModalProps): React.ReactElement {
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
    <Dialog
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
    </Dialog>
  )
}
