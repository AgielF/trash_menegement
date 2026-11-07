import { useEffect, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { TextField } from '@/shared/components/ui/TextField'
import {
  approveUser,
  fetchAdminSettings,
  fetchPendingUsers,
  rejectUser,
  setKasbonLimit,
} from '@/features/payment/api'
import { formatRupiah } from '@/features/payment/clamp'
import type { AdminSettings, PendingUser } from '@/features/payment/schemas'

/**
 * Layout dasar Admin: daftar user pending (approve/reject) dan
 * pengaturan batas kasbon global (F16). Otorisasi di server (RolesGuard);
 * UI hanya menyembunyikan menu untuk pengalaman pengguna.
 */

export function AdminPage(): React.ReactElement {
  const [users, setUsers] = useState<readonly PendingUser[]>([])
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh(): Promise<void> {
    setError(null)
    try {
      const [pending, adminSettings] = await Promise.all([
        fetchPendingUsers(),
        fetchAdminSettings(),
      ])
      setUsers(pending)
      setSettings(adminSettings)
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

  async function onApprove(userId: string): Promise<void> {
    setBusyId(userId)
    try {
      await approveUser(userId)
      await refresh()
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
    } finally {
      setBusyId(null)
    }
  }

  async function onReject(userId: string): Promise<void> {
    setBusyId(userId)
    try {
      await rejectUser(userId)
      await refresh()
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-dvh bg-surface px-4 py-5">
      <h1 className="text-lg font-bold text-neutral-900">Admin</h1>
      {error !== null ? (
        <p role="alert" className="mt-2 text-xs text-status-kasbon">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="pending-heading" className="mt-4">
        <h2 id="pending-heading" className="text-sm font-bold text-neutral-900">
          User menunggu persetujuan
        </h2>
        {loading ? (
          <p className="mt-2 text-xs text-neutral-500" aria-busy="true">
            Memuat…
          </p>
        ) : users.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-500">Tidak ada user pending.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {users.map((user) => (
              <li key={user.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-bold text-neutral-900">{user.fullName}</p>
                <p className="text-xs text-neutral-600">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    label="Setujui"
                    variant="pill-green"
                    loading={busyId === user.id}
                    onClick={() => {
                      void onApprove(user.id)
                    }}
                  />
                  <Button
                    label="Tolak"
                    variant="pill-green"
                    loading={busyId === user.id}
                    onClick={() => {
                      void onReject(user.id)
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {settings === null ? (
        <p className="mt-6 text-xs text-neutral-500">Memuat pengaturan…</p>
      ) : (
        <KasbonLimitCard initial={settings.kasbonLimit} onError={setError} />
      )}
    </main>
  )
}

/** Kartu batas kasbon global (F16) — PATCH /admin/settings/kasbon-limit { value }. */
function KasbonLimitCard({
  initial,
  onError,
}: {
  initial: number | null
  onError: (message: string) => void
}): React.ReactElement {
  const [value, setValue] = useState(initial === null ? '' : String(initial))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(): Promise<void> {
    setNotice(null)
    onError('')
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      onError('Batas kasbon harus bilangan bulat ≥ 0.')
      return
    }
    setBusy(true)
    try {
      const updated = await setKasbonLimit(parsed)
      setNotice(`Batas kasbon disimpan: ${updated.value}.`)
    } catch (caught: unknown) {
      onError(caught instanceof ApiError ? caught.message : 'Terjadi galat tak terduga.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="mt-6 rounded-2xl bg-white p-4 shadow-sm"
      aria-labelledby="kasbon-limit-heading"
    >
      <h2 id="kasbon-limit-heading" className="text-sm font-bold text-neutral-900">
        Batas Kasbon Global
      </h2>
      <p className="mt-0.5 text-xs text-neutral-600">
        {initial !== null ? `Saat ini: ${formatRupiah(initial)}` : 'Belum disetel (tanpa batas).'}
      </p>
      <div className="mt-3">
        <TextField
          name="kasbonLimit"
          label="Batas kasbon (rupiah)"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(next) => {
            setValue(next)
          }}
          showLabel
        />
      </div>
      {notice !== null ? (
        <p role="status" className="mt-2 text-xs font-medium text-brand">
          {notice}
        </p>
      ) : null}
      <div className="mt-3">
        <Button label="Simpan Batas" type="submit" loading={busy} />
      </div>
    </form>
  )
}
