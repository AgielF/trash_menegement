// src/config/status.ts — satu sumber kebenaran untuk status kartu rumah.
// Warna menurut keputusan desain (7 Nov): abu-abu=belum, hijau=lunas,
// merah=kasbon, kuning=sebagian, merah beda nuansa=skip. Label teks WAJIB
// menyertai warna (WCAG 2.2 AA — status tidak boleh hanya lewat warna).
export type DisplayStatus = 'belum_diambil' | 'skip' | 'lunas' | 'sebagian' | 'kasbon'

export const STATUS_PRESENTATION: Record<DisplayStatus, { label: string; className: string }> = {
  belum_diambil: { label: 'Belum diambil', className: 'bg-status-belum' },
  lunas: { label: 'Sudah diambil · Sudah bayar', className: 'bg-status-lunas' },
  sebagian: { label: 'Sudah diambil · Bayar sebagian', className: 'bg-status-sebagian' },
  kasbon: { label: 'Sudah diambil · Belum bayar', className: 'bg-status-kasbon' },
  skip: { label: 'Skip', className: 'bg-status-skip' },
}

export interface CardStatusInput {
  pickupStatus: 'belum_diambil' | 'sudah_diambil'
  paymentStatus: 'belum_bayar' | 'sebagian' | 'lunas'
  /** Ada baris skips dengan skipDate == hari ini (WIB)? */
  skippedToday: boolean
}

export function deriveDisplayStatus(input: CardStatusInput): DisplayStatus {
  if (input.pickupStatus === 'belum_diambil') {
    return input.skippedToday ? 'skip' : 'belum_diambil'
  }
  switch (input.paymentStatus) {
    case 'lunas':
      return 'lunas'
    case 'sebagian':
      return 'sebagian'
    case 'belum_bayar':
      return 'kasbon'
  }
}
