/** Format an ISO date using the WIB calendar. */
export function formatWibDateTimeLabel(iso: string): string {
  return formatWibDayLabel(new Date(iso))
}

export function formatWibDayLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}
