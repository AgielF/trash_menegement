import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { PlaceholderAvatar } from '@/shared/components/ui/Placeholder'
import { formatRupiah } from './clamp'
import type { OutstandingRow } from './schemas'
import { useKasbon } from './useKasbon'
import { PaymentHistory } from './components/PaymentHistory'
import { PaymentForm } from './components/PaymentForm'
import { formatWibDateTimeLabel } from './format'

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

interface PaymentSectionProps {
  houseId: string
  ownerName: string | null
}

/** F13 — Detail kasbon rumah: daftar record (sisa > 0) + form pelunasan. */
export function KasbonDetailPage({ houseId, ownerName }: PaymentSectionProps): React.ReactElement {
  const { rows, loading, offline, error, house, history, historyLoading, refresh, recordPayment } =
    useKasbon(houseId)

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

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
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
            onSave={recordPayment}
            onPaid={() => {
              void refresh()
            }}
          />
        ) : null}

        <PaymentHistory items={history} loading={historyLoading} />
      </section>
    </div>
  )
}
