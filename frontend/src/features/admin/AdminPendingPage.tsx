import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { useToast } from '@/shared/components/ui/toast-constants'
import { approveUser, fetchPendingUsers, rejectUser } from '@/features/payment/api'
import type { PendingUser } from '@/features/payment/schemas'

/**
 * F11 — Halaman Persetujuan (admin-only): daftar user menunggu persetujuan
 * + tombol Setujui (PATCH /admin/approve/:id) / Tolak (PATCH /admin/reject/:id).
 * Otorisasi sesungguhnya di server (RolesGuard); cek role di UI hanya untuk UX.
 */
export function AdminPendingPage(): React.ReactElement {
  const [users, setUsers] = useState<readonly PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { showToast } = useToast()

  async function refresh(): Promise<void> {
    setError(null)
    try {
      const pending = await fetchPendingUsers()
      setUsers(pending)
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await refresh()
    })()
  }, [])

  async function onDecide(userId: string, decision: 'approve' | 'reject'): Promise<void> {
    setBusyId(userId)
    try {
      if (decision === 'approve') {
        await approveUser(userId)
        showToast('User disetujui.', 'success')
      } else {
        await rejectUser(userId)
        showToast('User ditolak.', 'warning')
      }
      await refresh()
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
      showToast(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <h1 className="text-lg font-bold">Persetujuan Petugas</h1>
        <p className="text-xs font-medium">User yang menunggu verifikasi admin</p>
      </CurvedHeader>

      <section className="relative -mt-8 rounded-tl-[3rem] bg-surface px-5 pt-6">
        {error !== null ? (
          <p role="alert" className="mb-3 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : users.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-neutral-600 shadow-sm">
            Tidak ada user yang menunggu persetujuan. 🎉
          </p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="User menunggu persetujuan">
            {users.map((user) => (
              <li key={user.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-bold text-neutral-900">{user.fullName}</p>
                <p className="text-xs text-neutral-600">{user.email}</p>
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  Didaftarkan {new Date(user.createdAt).toLocaleDateString('id-ID')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    label="Setujui"
                    variant="pill-green"
                    loading={busyId === user.id}
                    onClick={() => {
                      void onDecide(user.id, 'approve')
                    }}
                  />
                  <Button
                    label="Tolak"
                    variant="pill-green"
                    className="bg-white! text-status-kasbon!"
                    loading={busyId === user.id}
                    onClick={() => {
                      void onDecide(user.id, 'reject')
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
