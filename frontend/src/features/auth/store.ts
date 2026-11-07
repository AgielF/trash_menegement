import { create } from 'zustand'
import { z } from 'zod'
import { getItem, removeItem, setItem } from '@/shared/lib/storage'
import { navigate } from '@/shared/lib/router'
import type { SessionUser } from './schemas'
import { sessionUserSchema } from './schemas'

/**
 * Sesi tersimpan di localStorage terpusat (D1: risiko diterima sementara,
 * playbook bagian 5). Baca selalu lewat skema karena storage = data dari luar.
 */
const tokenSchema = z.string().min(1)

interface AuthState {
  token: string | null
  user: SessionUser | null
  isReady: boolean
  hydrate: () => void
  setSession: (token: string, user: SessionUser) => void
  logout: (options?: { force?: boolean }) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isReady: false,
  hydrate: () => {
    const token = getItem('authToken', tokenSchema)
    const user = getItem('user', sessionUserSchema)
    set({ token, user, isReady: true })
  },
  setSession: (token, user) => {
    setItem('authToken', token)
    setItem('user', user)
    set({ token, user })
  },
  logout: (options) => {
    // NOTE(Iris 4): aturan "jangan logout saat outbox berisi" diaktifkan
    // bersama features/sync — cek antrean dipindah ke syncStore.
    removeItem('authToken')
    removeItem('user')
    set({ token: null, user: null })
    if (options?.force !== true) navigate('/login')
  },
}))
