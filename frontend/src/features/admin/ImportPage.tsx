import { useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { CurvedHeader } from '@/shared/components/ui/CurvedHeader'
import { confirmHouseImport, uploadImportPreview, type ImportPreview } from './api'

export function ImportPage(): React.ReactElement {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function upload(): Promise<void> {
    if (file === null) {
      setError('Pilih file terlebih dahulu.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    setPreview(null)
    try {
      setPreview(await uploadImportPreview(file))
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'File gagal diproses.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm(): Promise<void> {
    if (preview === null) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await confirmHouseImport(preview)
      const failed = preview.summary.errorRows + result.failedRows
      setNotice(`${String(result.importedHouses)} data berhasil disimpan, ${String(failed)} gagal.`)
      setPreview(null)
      setFile(null)
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : 'Data gagal disimpan.')
    } finally {
      setBusy(false)
    }
  }

  const validCount = preview?.summary.validRows ?? 0

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface pb-6">
      <CurvedHeader>
        <p className="text-[10px] font-bold tracking-widest text-white/80">MANAJEMEN ADMIN</p>
        <h1 className="mt-1 text-lg font-bold">Import Data Rumah</h1>
        <p className="text-xs">Unggah data untuk ditinjau sebelum disimpan.</p>
      </CurvedHeader>

      <section className="relative -mt-7 flex flex-col gap-4 rounded-tl-[3rem] bg-surface px-4 pt-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label htmlFor="import-file" className="mb-2 block text-sm font-bold text-neutral-800">
            Pilih file data
          </label>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls,.pdf,.docx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setPreview(null)
              setError(null)
              setNotice(null)
            }}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Kolom Excel yang dikenali: owner_name, rt, gang, next_due_date, interval_days,
            default_fee. Backend saat ini memproses file Excel (.xlsx/.xls) dan CSV; PDF/DOCX belum
            didukung.
          </p>
          <div className="mt-4">
            <Button
              label="Upload & Preview"
              variant="pill-green"
              loading={busy}
              onClick={() => void upload()}
            />
          </div>
        </div>

        {error !== null ? (
          <p role="alert" className="rounded-2xl bg-white p-4 text-sm text-status-kasbon">
            {error}
          </p>
        ) : null}
        {notice !== null ? (
          <p role="status" className="rounded-2xl bg-brand/10 p-4 text-sm font-semibold text-brand">
            {notice}
          </p>
        ) : null}

        {preview !== null ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Pratinjau {preview.fileName}</h2>
                <p className="mt-1 text-xs text-neutral-600">
                  {preview.summary.totalRows} baris · {preview.summary.validRows} valid ·{' '}
                  {preview.summary.errorRows} bermasalah
                </p>
              </div>
              <Button
                label="Simpan Data ke Database"
                variant="pill-green"
                loading={busy}
                disabled={validCount === 0}
                onClick={() => void confirm()}
              />
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full min-w-195 border-collapse text-left text-xs">
                <thead className="bg-brand/10 text-neutral-700">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">
                      Baris
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Nama
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      RT / Gang
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Tanggal
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Interval
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Nominal
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Hasil validasi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr
                      key={row.row}
                      className={`border-t align-top ${row.valid ? 'border-neutral-100' : 'border-status-kasbon/20 bg-status-kasbon/5'}`}
                    >
                      <td className="px-3 py-2.5">{row.row}</td>
                      <td className="px-3 py-2.5 font-medium text-neutral-900">
                        {row.ownerName ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-700">
                        <span className="block">{row.rt === null ? '—' : `RT ${row.rt}`}</span>
                        {row.gang ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">{row.nextDueDate ?? '—'}</td>
                      <td className="px-3 py-2.5">{row.intervalDays ?? '—'} hari</td>
                      <td className="px-3 py-2.5">
                        {row.defaultFee === null
                          ? '—'
                          : `Rp ${row.defaultFee.toLocaleString('id-ID')}`}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.valid ? (
                          <span className="font-semibold text-brand">Valid</span>
                        ) : (
                          <span className="font-medium text-status-kasbon">
                            {row.errors.join('; ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.summary.errorRows > 0 ? (
              <p className="mt-3 text-xs text-neutral-600">
                Baris error tidak akan disimpan; hanya {preview.summary.validRows} baris valid yang
                dikonfirmasi.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
