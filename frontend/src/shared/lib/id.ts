/**
 * Pembuat ID di klien. Semua ID entitas offline dibuat di perangkat (playbook
 * aturan bisnis 5: ID klien = kunci idempotensi di /sync/push).
 */
export function newId(): string {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID tidak tersedia; butuh konteks aman (HTTPS/localhost).')
  }
  return crypto.randomUUID()
}
