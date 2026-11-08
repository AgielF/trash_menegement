import { useCreateHouse } from './useCreateHouse'
import { Button } from '@/shared/components/ui/Button'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { useToast } from '@/shared/components/ui/toast-constants'
import { useNavigate } from 'react-router-dom'
import { APP_PATHS } from '@/config/routes'
import { HouseFormFields } from './components/HouseFormFields'

export function CreateHousePage({ houseId }: { houseId?: string }): React.ReactElement {
  const {
    form,
    update,
    collectors,
    isAdmin,
    error,
    busy,
    loading,
    submit: saveHouse,
  } = useCreateHouse(houseId)
  const { showToast } = useToast()
  const navigate = useNavigate()

  async function submit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!(await saveHouse())) return
    showToast(
      houseId === undefined ? 'Rumah berhasil ditambahkan.' : 'Data rumah berhasil diperbarui.',
      'success',
    )
    void navigate(isAdmin ? APP_PATHS.adminHouses : APP_PATHS.houses)
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader backRole={isAdmin ? 'admin' : 'collector'}>
        <p className="text-[10px] font-bold tracking-widest text-white/80">MANAJEMEN RUMAH</p>
        <h1 className="mt-1 text-lg font-bold">
          {houseId === undefined ? 'Tambah Rumah' : 'Edit Rumah'}
        </h1>
        <p className="text-xs">
          {isAdmin
            ? 'Pilih petugas yang bertanggung jawab atas rumah ini.'
            : 'Rumah akan otomatis ditugaskan kepada akun yang sedang masuk.'}
        </p>
      </CurvedHeader>

      <form
        onSubmit={(event) => {
          void submit(event)
        }}
        className="relative -mt-7 flex flex-col gap-4 rounded-tl-[3rem] bg-surface px-5 pt-6"
      >
        <HouseFormFields
          form={form}
          update={update}
          collectors={collectors}
          isAdmin={isAdmin}
          loading={loading}
        />
        {error !== null ? (
          <p role="alert" className="text-sm text-status-kasbon">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pb-4">
          <Button
            label={houseId === undefined ? 'Simpan Rumah' : 'Simpan Perubahan'}
            type="submit"
            variant="pill-green"
            loading={busy || loading}
          />
          <Button
            label="Batal"
            variant="pill-green"
            className="bg-neutral-500"
            onClick={() => {
              void navigate(isAdmin ? APP_PATHS.adminHouses : APP_PATHS.houses)
            }}
          />
        </div>
      </form>
    </div>
  )
}
