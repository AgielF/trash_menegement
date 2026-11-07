/**
 * Util tanggal bisnis terpusat (WIB / Asia-Jakarta, UTC+7).
 *
 * SEMUA tanggal bisnis (jatuh tempo, skip, "hari ini", rentang mingguan, bulanan)
 * wajib lewat modul ini — sesuai aturan bisnis playbook. Backend menyimpan tanggal
 * bisnis sebagai `Date` pukul 00:00 UTC dari hari WIB terkait (lihat docs/recon-backend.md),
 * jadi konvensi di sini dibuat identik agar perbandingan konsisten.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * "Sekarang" dalam zona bisnis. Satu-satunya titik yang boleh memanggil new Date()
 * untuk logika bisnis — semua pemakaian lain harus mulai dari sini.
 */
export function nowWib(): Date {
  return new Date()
}

/** Tanggal-nol (pukul 00:00 UTC) hari WIB saat ini. */
export function getTodayWib(): Date {
  return wibStartOfUtcDay(new Date())
}

/**
 * Label tanggal "Sabtu, 17 Okt 2026" menurut kalender WIB (dipakai header Beranda).
 */
const WEEKDAY_LABELS: readonly string[] = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]
const MONTH_LABELS: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export function formatWibDateLabel(now: Date): string {
  const shifted = new Date(now.getTime() + WIB_OFFSET_MS)
  const weekday = WEEKDAY_LABELS[shifted.getUTCDay()] ?? ''
  const day = shifted.getUTCDate()
  const month = MONTH_LABELS[shifted.getUTCMonth()] ?? ''
  return `${weekday}, ${String(day)} ${month} ${String(shifted.getUTCFullYear())}`
}

/**
 * Pukul 00:00 UTC dari hari WIB yang memuat tanggal/rentang waktu `date`.
 *
 * Konvensi identik dengan backend (docs/recon-backend.md): tanggal bisnis
 * disimpan sebagai pukul 00:00 UTC dari hari WIB terkait — bukan tengah malam WIB.
 */
export function wibStartOfUtcDay(date: Date): Date {
  const shifted = date.getTime() + WIB_OFFSET_MS
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS)
}

/** Format tanggal bisnis sebagai "YYYY-MM-DD" menurut kalender WIB. */
export function toWibDateString(date: Date): string {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS)
  const year = String(shifted.getUTCFullYear()).padStart(4, '0')
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Sebutkan jumlah hari (bisa negatif) tanpa memengaruhi pukul 00:00 UTC. */
export function addDaysWib(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Apakah dua tanggal jatuh pada hari WIB yang sama? */
export function isSameWibDate(a: Date, b: Date): boolean {
  return toWibDateString(a) === toWibDateString(b)
}

export interface DateRange {
  /** batas bawah inklusif (00:00 UTC hari WIB pertama) */
  start: Date
  /** batas atas eksklusif (00:00 UTC hari WIB setelah hari terakhir) */
  end: Date
}

/** Rentang minggu berjalan menurut kalender WIB: Senin (inklusif) sampai Minggu. */
export function getWibWeekRange(date: Date): DateRange {
  const dayStart = wibStartOfUtcDay(date)
  // Backend memakai (getUTCDay()+6)%7 setelah geser WIB — identik dengan index Senin=0.
  const shifted = new Date(dayStart.getTime() + WIB_OFFSET_MS)
  const weekdayIndex = (shifted.getUTCDay() + 6) % 7
  const start = addDaysWib(dayStart, -weekdayIndex)
  return { start, end: addDaysWib(start, 7) }
}

/** Rentang bulan kalender WIB: hari pertama sampai pertama bulan berikutnya. */
export function getWibMonthRange(date: Date): DateRange {
  const shifted = new Date(wibStartOfUtcDay(date).getTime() + WIB_OFFSET_MS)
  const start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1))
  const end = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 1))
  return { start, end }
}
