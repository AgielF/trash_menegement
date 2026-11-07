import type { HttpHandler } from 'msw'

/**
 * Kosong saat Iris 1. Setiap iris menambahkan handler di sini dengan skema zod
 * yang sama dipakai aplikasi (playbook 3.12) agar kontrak tidak menyimpang.
 */
export const handlers: HttpHandler[] = []
