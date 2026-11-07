import { describe, expect, it } from 'vitest'
import {
  addDaysWib,
  getTodayWib,
  getWibMonthRange,
  getWibWeekRange,
  isSameWibDate,
  toWibDateString,
  wibStartOfUtcDay,
} from './date'

/**
 * Pola uji: bangun tanggal dalam zona waktu perangkat yang "berbahaya"
 * (misalnya malam dini hari Transantarctica/UTC-5 dsb. dinormalisasi dengan
 * membangun dari UTC), lalu periksa hasil kalender WIB.
 */
const utc = (iso: string): Date => new Date(iso)

describe('wibStartOfUtcDay', () => {
  it('mengembalikan pukul 00:00 UTC hari WIB yang memuat rentang waktu itu', () => {
    // 2026-11-07T02:00Z = 2026-11-07 09:00 WIB → hari yang sama pukul 00:00 UTC.
    const dayStart = wibStartOfUtcDay(utc('2026-11-07T02:00:00.000Z'))
    expect(dayStart.toISOString()).toBe('2026-11-07T00:00:00.000Z')

    // 2026-11-06T21:00Z = 2026-11-07 04:00 WIB → "hari WIB" sudah ke 7.
    const afterMidnight = wibStartOfUtcDay(utc('2026-11-06T21:00:00.000Z'))
    expect(afterMidnight.toISOString()).toBe('2026-11-07T00:00:00.000Z')
  })
})

describe('toWibDateString', () => {
  it('memformat menurut kalender WIB, bukan jam perangkat', () => {
    expect(toWibDateString(utc('2026-11-06T21:30:00.000Z'))).toBe('2026-11-07')
    expect(toWibDateString(utc('2026-11-07T10:00:00.000Z'))).toBe('2026-11-07')
    expect(toWibDateString(utc('2026-11-07T16:59:00.000Z'))).toBe('2026-11-07')
  })
})

describe('getTodayWib', () => {
  it('berada di pukul 00:00 UTC dari hari WIB saat ini', () => {
    const today = getTodayWib()
    expect(today.getTime() % (24 * 60 * 60 * 1000)).toBe(0)
    expect(isSameWibDate(today, new Date())).toBe(true)
  })
})

describe('addDaysWib', () => {
  it('tidak menggeser pukul nol', () => {
    const dayStart = utc('2026-11-07T00:00:00.000Z')
    expect(addDaysWib(dayStart, -1).toISOString()).toBe('2026-11-06T00:00:00.000Z')
    expect(addDaysWib(dayStart, 7).toISOString()).toBe('2026-11-14T00:00:00.000Z')
  })
})

describe('getWibWeekRange', () => {
  it('Senin sebagai awal minggu, Minggu sebagai akhir (rentang eksklusif)', () => {
    // 2026-11-07 adalah hari Sabtu.
    const range = getWibWeekRange(utc('2026-11-07T03:00:00.000Z'))
    expect(toWibDateString(range.start)).toBe('2026-11-02') // Senin
    expect(toWibDateString(range.end)).toBe('2026-11-09') // Senin berikutnya (eksklusif)

    // Ujung: hari Minggu gelombang malam (2026-11-08T20:00Z = Senin dini hari WIB).
    const nextWeek = getWibWeekRange(utc('2026-11-08T20:00:00.000Z'))
    expect(toWibDateString(nextWeek.start)).toBe('2026-11-09')
    expect(toWibDateString(nextWeek.end)).toBe('2026-11-16')
  })
})

describe('getWibMonthRange', () => {
  it('awal dan akhir bulan kalender WIB', () => {
    // 2026-10-31T23:00Z = 2026-11-01 06:00 WIB → bulan November.
    const range = getWibMonthRange(utc('2026-10-31T23:00:00.000Z'))
    expect(toWibDateString(range.start)).toBe('2026-11-01')
    expect(toWibDateString(range.end)).toBe('2026-12-01')
  })
})

describe('isSameWibDate', () => {
  it('dua momen pada hari WIB berbeda dianggap berbeda', () => {
    expect(isSameWibDate(utc('2026-11-06T21:00:00.000Z'), utc('2026-11-07T00:00:00.000Z'))).toBe(
      true,
    )
    expect(isSameWibDate(utc('2026-11-06T16:00:00.000Z'), utc('2026-11-07T00:00:00.000Z'))).toBe(
      false,
    )
  })
})
