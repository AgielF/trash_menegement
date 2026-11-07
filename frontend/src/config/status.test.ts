import { describe, expect, it } from 'vitest'
import { deriveDisplayStatus, STATUS_PRESENTATION } from './status'

describe('deriveDisplayStatus (pemetaan status kartu rumah)', () => {
  it('rumah belum diambil tanpa skip → belum_diambil', () => {
    expect(
      deriveDisplayStatus({
        pickupStatus: 'belum_diambil',
        paymentStatus: 'belum_bayar',
        skippedToday: false,
      }),
    ).toBe('belum_diambil')
  })

  it('rumah belum diambil yang di-skip hari ini → skip', () => {
    expect(
      deriveDisplayStatus({
        pickupStatus: 'belum_diambil',
        paymentStatus: 'belum_bayar',
        skippedToday: true,
      }),
    ).toBe('skip')
  })

  it('sudah diambil & lunas → lunas', () => {
    expect(
      deriveDisplayStatus({
        pickupStatus: 'sudah_diambil',
        paymentStatus: 'lunas',
        skippedToday: false,
      }),
    ).toBe('lunas')
  })

  it('sudah diambil bayar sebagian → sebagian (kuning)', () => {
    expect(
      deriveDisplayStatus({
        pickupStatus: 'sudah_diambil',
        paymentStatus: 'sebagian',
        skippedToday: false,
      }),
    ).toBe('sebagian')
  })

  it('sudah diambil belum bayar → kasbon (merah)', () => {
    expect(
      deriveDisplayStatus({
        pickupStatus: 'sudah_diambil',
        paymentStatus: 'belum_bayar',
        skippedToday: false,
      }),
    ).toBe('kasbon')
  })

  it('setiap status punya label teks (WCAG — status tidak boleh hanya warna)', () => {
    for (const [status, presentation] of Object.entries(STATUS_PRESENTATION)) {
      expect(presentation.label.trim().length, `status ${status} tanpa label`).toBeGreaterThan(0)
    }
  })
})
