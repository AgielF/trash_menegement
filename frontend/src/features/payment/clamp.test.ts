import { describe, expect, it } from 'vitest'
import { clampToSisa, exceedsSisa } from './clamp'

describe('clampToSisa (aturan bisnis: bayar ≤ sisa tagihan)', () => {
  it('clamp nominal besar ke sisa', () => {
    expect(clampToSisa(25_000, 20_000)).toBe(20_000)
  })

  it('nominal di bawah sisa tidak diubah', () => {
    expect(clampToSisa(5_000, 20_000)).toBe(5_000)
  })

  it('nominal persis sisa lolos', () => {
    expect(clampToSisa(20_000, 20_000)).toBe(20_000)
  })

  it('nominal < 1 → minimal 1 bila masih ada sisa', () => {
    expect(clampToSisa(0, 20_000)).toBe(1)
  })

  it('nominal < 1 tanpa sisa → 0 (tidak bisa dibayar)', () => {
    expect(clampToSisa(0, 0)).toBe(0)
  })

  it('exceedsSisa hanya true bila melebihi', () => {
    expect(exceedsSisa(25_000, 20_000)).toBe(true)
    expect(exceedsSisa(20_000, 20_000)).toBe(false)
    expect(exceedsSisa(1, 0)).toBe(true)
  })
})
