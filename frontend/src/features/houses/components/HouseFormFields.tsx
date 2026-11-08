import type { ReactElement } from 'react'
import type { AdminCollector } from '@/features/admin/api'
import type { HouseFormValues } from '../useCreateHouse'
import { FormField } from '@/shared/components/ui/FormField'
import { SelectField } from '@/shared/components/ui/SelectField'

export interface HouseFormFieldsProps {
  form: HouseFormValues
  update: (key: keyof HouseFormValues, value: string) => void
  collectors: readonly AdminCollector[]
  isAdmin: boolean
  loading: boolean
}

export function HouseFormFields({
  form,
  update,
  collectors,
  isAdmin,
  loading,
}: HouseFormFieldsProps): ReactElement {
  return (
    <>
      {loading ? (
        <p className="text-center text-sm text-neutral-500" aria-busy="true">
          Memuat data rumah dan petugas…
        </p>
      ) : null}
      {isAdmin ? (
        <SelectField
          label="Petugas (Collector)"
          name="collectorId"
          value={form.collectorId}
          required
          onChange={(value) => {
            update('collectorId', value)
          }}
          error={
            collectors.length === 0 && !loading
              ? 'Belum ada petugas disetujui untuk dipilih.'
              : null
          }
        >
          <option value="">Pilih petugas</option>
          {collectors.map((collector) => (
            <option key={collector.id} value={collector.id}>
              {collector.fullName} · {collector.email}
            </option>
          ))}
        </SelectField>
      ) : null}
      <FormField
        label="Nama pemilik"
        name="ownerName"
        value={form.ownerName}
        required
        onChange={(value) => {
          update('ownerName', value)
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="RT"
          name="rt"
          value={form.rt}
          required
          onChange={(value) => {
            update('rt', value)
          }}
        />
        <FormField
          label="Gang"
          name="gang"
          value={form.gang}
          required
          onChange={(value) => {
            update('gang', value)
          }}
        />
      </div>
      <FormField
        label="Catatan alamat (opsional)"
        name="addressNote"
        value={form.addressNote}
        onChange={(value) => {
          update('addressNote', value)
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Nominal default (Rp)"
          name="defaultFee"
          type="number"
          min="0"
          value={form.defaultFee}
          required
          onChange={(value) => {
            update('defaultFee', value)
          }}
        />
        <FormField
          label="Interval (hari)"
          name="intervalDays"
          type="number"
          min="1"
          value={form.intervalDays}
          required
          onChange={(value) => {
            update('intervalDays', value)
          }}
        />
      </div>
      <FormField
        label="Jatuh tempo berikutnya"
        name="nextDueDate"
        type="date"
        value={form.nextDueDate}
        required
        onChange={(value) => {
          update('nextDueDate', value)
        }}
      />
    </>
  )
}
