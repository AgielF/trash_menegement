interface DashboardStatsProps {
  progressPercent: number
  pickedToday: number
  totalHouses: number
  bagsToday: number
  moneyToday: number
  loading: boolean
}

export function DashboardStats({
  progressPercent,
  pickedToday,
  totalHouses,
  bagsToday,
  moneyToday,
  loading,
}: DashboardStatsProps): React.ReactElement {
  return (
    <>
      <div className="mt-3 flex items-center gap-4 rounded-2xl bg-card-green px-5 py-4 text-white shadow-sm">
        <div
          role="img"
          aria-label={`Progres hari ini ${String(progressPercent)}%`}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/90 text-sm font-bold text-brand"
        >
          {progressPercent}%
        </div>
        <div>
          <p className="text-sm font-bold">Hari ini</p>
          <p className="text-xs">
            {loading ? 'Memuat…' : `${String(pickedToday)} dari ${String(totalHouses)} rumah`}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-card-green px-4 py-3 text-white shadow-sm">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-pink-200 text-pink-800"
          >
            🧺
          </span>
          <div>
            <p className="text-sm font-bold">Karung</p>
            <p className="text-xs">{loading ? 'Memuat…' : `${String(bagsToday)} Pcs`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-card-green px-4 py-3 text-white shadow-sm">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-red-200 text-red-800"
          >
            💵
          </span>
          <div>
            <p className="text-sm font-bold">Uang</p>
            <p className="text-xs">
              {loading ? 'Memuat…' : `Rp. ${moneyToday.toLocaleString('id-ID')}`}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
