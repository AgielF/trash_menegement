/**
 * Helper tanggal bisnis zona WIB (UTC+7).
 *
 * Konvensi (lihat erd-final.md bagian 8):
 * - `datetime` disimpan dalam UTC.
 * - `date` bisnis (due_date, skip_date, session_date) memakai zona waktu lokal petugas (WIB).
 *
 * Konvensi representasi: tanggal bisnis WIB disimpan sebagai Date pukul
 * 00:00:00 UTC yang bertepatan dengan hari tersebut, sehingga aman dipakai
 * pada kolom Prisma `@db.Date`.
 */

/** Offset WIB (UTC+7) dalam milidetik. */
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Jumlah milidetik dalam sehari. */
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Ambil bagian `YYYY-MM-DD` dari sebuah instant, dalam zona WIB. */
export function toWibDateString(date: Date): string {
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Tanggal bisnis hari ini (WIB), sebagai Date pukul 00:00 UTC hari tersebut. */
export function getTodayWib(now: Date = new Date()): Date {
  const iso = toWibDateString(now);
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Tambah `days` hari kalender pada tanggal bisnis WIB. */
export function addDaysWib(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Cek apakah dua instant berada pada hari kalender yang sama di WIB. */
export function isSameWibDate(a: Date, b: Date): boolean {
  return toWibDateString(a) === toWibDateString(b);
}
