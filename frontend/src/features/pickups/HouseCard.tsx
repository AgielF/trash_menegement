import { deriveDisplayStatus, STATUS_PRESENTATION, type CardStatusInput } from '@/config/status'

type CardData = CardStatusInput & {
  id: string
  ownerName: string
  rt: string
  gang: string
  pendingSync?: boolean
}

/**
 * Kartu rumah persis referensi Daftar Rumah: sudut membulat, warna latar
 * berdasarkan status, nama pemilik + "RT .. · Gang ..", label status teks di kanan.
 */
export function HouseCard({ house }: { house: CardData }): React.ReactElement {
  const status = deriveDisplayStatus(house)
  const presentation = STATUS_PRESENTATION[status]
  return (
    <article className={`rounded-2xl px-4 py-3 shadow-sm ${presentation.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-neutral-900">{house.ownerName}</h3>
          <p className="mt-0.5 text-xs text-neutral-900">
            RT {house.rt} · Gang {house.gang}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold text-neutral-900">{presentation.label}</p>
          {house.pendingSync === true ? (
            <p className="mt-1 text-[10px] font-semibold text-amber-800" role="status">
              ⏳ Menunggu Sinkronisasi
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
