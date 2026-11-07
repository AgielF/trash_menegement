/**
 * Util uang murni (bisa dites): clamp jumlah bayar ke sisa tagihan.
 * Aturan bisnis: jumlah bayar TIDAK BOLEH melebihi sisa; server tetap penentu,
 * clamp klien hanya untuk UI/offline dan estimasi.
 */

export function clampToSisa(amount: number, sisa: number): number {
  if (amount < 1) return sisa >= 1 ? 1 : 0
  return Math.min(amount, sisa)
}

/** Apakah jumlah bayar melebihi sisa (memicu clamp server/notifikasi UI)? */
export function exceedsSisa(amount: number, sisa: number): boolean {
  return amount > sisa
}

/** Format rupiah "Rp. 12.000" ala referensi Figma. */
export function formatRupiah(amount: number): string {
  return `Rp. ${amount.toLocaleString('id-ID')}`
}
