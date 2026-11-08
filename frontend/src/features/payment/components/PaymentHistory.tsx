import type { PaymentHistoryItem } from '../service'
import { formatWibDayLabel } from '../format'
import { formatRupiah } from '../clamp'

export function PaymentHistory({
  items,
  loading,
}: {
  items: readonly PaymentHistoryItem[]
  loading: boolean
}): React.ReactElement | null {
  if (loading) return null

  return (
    <div className="mt-6">
      <h2 className="px-1 text-sm font-bold text-neutral-900">Riwayat pembayaran rumah ini</h2>
      {items.length === 0 ? (
        <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-center text-xs text-neutral-500 shadow-sm">
          Belum ada pembayaran tercatat untuk rumah ini.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2" aria-label="Riwayat pembayaran rumah">
          {items.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm"
            >
              <span className="truncate text-xs text-neutral-600">
                {formatWibDayLabel(new Date(payment.paidAt))}
                {payment.note !== null ? ` · ${payment.note}` : ''}
              </span>
              <span className="shrink-0 font-bold">{formatRupiah(payment.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
