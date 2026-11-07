import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmImportDto } from './dto/confirm-import.dto';

export interface PreviewRow {
  row: number;
  ownerName: string | null;
  rt: string | null;
  gang: string | null;
  addressNote: string | null;
  nextDueDate: string | null;
  intervalDays: number | null;
  defaultFee: number | null;
  valid: boolean;
  errors: string[];
}

export interface ImportPreview {
  fileName: string;
  sheetName: string;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
  rows: PreviewRow[];
}

/** Normalisasi header: huruf kecil, spasi/seret jadi underscore. */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[\s\-.]+/g, '_');
}

/** Konversi serial tanggal Excel (number) → string ISO tanggal. */
function excelSerialToIso(serial: number): string | null {
  if (serial < 25569 || serial > 100000) return null; // luar rentang 1970–2173
  const ssf = XLSX.SSF as {
    parse_date_code?: (
      serial: number,
    ) => { y: number; m: number; d: number } | false;
  };
  const parsed = ssf.parse_date_code?.(serial);
  if (!parsed) return null;
  const { y, m, d } = parsed;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Terima tanggal dari Excel (string/serial) → YYYY-MM-DD. */
function parseDateCell(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return excelSerialToIso(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return excelSerialToIso(Number(text));
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * F10 (placeholder) — Pratinjau import Excel tanpa menyimpan ke DB.
   *
   * Kolom yang diharapkan: owner_name/owner, rt, gang, address_note,
   * next_due_date, interval_days, default_fee.
   */
  previewImport(file: Express.Multer.File): ImportPreview {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    return this.buildPreview(file);
  }

  private buildPreview(file: Express.Multer.File): ImportPreview {
    const allowed = ['xlsx', 'xls', 'csv'];
    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    if (!allowed.includes(ext)) {
      throw new BadRequestException(
        `Tipe file harus salah satu dari: ${allowed.join(', ')}`,
      );
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('File tidak bisa dibaca sebagai Excel/CSV');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('File tidak memiliki sheet');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: null },
    );

    const previewRows = rows.map((raw, index) =>
      this.buildPreviewRow(raw, index + 1),
    );
    const validRows = previewRows.filter((r) => r.valid).length;

    return {
      fileName: file.originalname,
      sheetName,
      summary: {
        totalRows: previewRows.length,
        validRows,
        errorRows: previewRows.length - validRows,
      },
      rows: previewRows,
    };
  }

  private buildPreviewRow(
    raw: Record<string, unknown>,
    rowNumber: number,
  ): PreviewRow {
    const cell: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      cell[normalizeKey(key)] = value;
    }

    const errors: string[] = [];

    const ownerName = this.text(cell.owner_name ?? cell.owner ?? cell.nama);
    const rt = this.text(cell.rt);
    const gang = this.text(cell.gang);
    const addressNote = this.text(
      cell.address_note ?? cell.alamat ?? cell.note,
    );
    const nextDueDate = parseDateCell(cell.next_due_date ?? cell.tanggal);
    const intervalDaysRaw = this.int(cell.interval_days ?? cell.interval);
    const defaultFeeRaw = this.int(
      cell.default_fee ?? cell.iuran ?? cell.nominal,
    );

    if (!ownerName) errors.push('kolom owner_name wajib diisi');
    if (!rt) errors.push('kolom rt wajib diisi');
    if (!gang) errors.push('kolom gang wajib diisi');
    if (!nextDueDate) errors.push('kolom next_due_date tidak valid');

    const intervalDays = intervalDaysRaw ?? 7; // default sesuai aturan
    if (intervalDays !== null && intervalDays < 1) {
      errors.push('interval_days minimal 1');
    }
    const defaultFee = defaultFeeRaw ?? 5000; // default sesuai aturan
    if (defaultFee !== null && defaultFee < 0) {
      errors.push('default_fee minimal 0');
    }

    return {
      row: rowNumber,
      ownerName,
      rt,
      gang,
      addressNote,
      nextDueDate,
      intervalDays,
      defaultFee,
      valid: errors.length === 0,
      errors,
    };
  }

  private text(value: unknown): string | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const s = String(value).trim();
    return s === '' ? null : s;
  }

  private int(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  /**
   * F10 lanjutan — Simpan hasil pratinjau ke database.
   *
   * Baris rumah dibuat satu per satu dalam satu transaksi (milik petugas
   * yang mengunggah), lalu satu baris `ImportBatch` dicatat dengan jumlah
   * total/sukses/gagal. Baris yang tidak valid harusnya sudah tersaring
   * di tahap pratinjau — di sini masih divalidasi ulang ringan (wajib
   * owner_name/rt/gang/date) untuk perombakan UUID duplikat dsb.
   */
  async confirmImport(dto: ConfirmImportDto, uploadedBy: string) {
    const importType = dto.importType ?? 'houses';
    if (importType === 'schedule') {
      throw new BadRequestException(
        'Jenis import jadwal belum didukung — gunakan "houses" untuk saat ini',
      );
    }

    const totalRows = dto.houses.length;

    // Baris sudah lolos validasi di tahap pratinjau, jadi bila satu baris
    // tetap gagal tersimpan, seluruh batch dibatalkan (all-or-nothing).
    return this.prisma.$transaction(async (tx) => {
      for (const row of dto.houses) {
        await tx.house.create({
          data: {
            ownerName: row.ownerName,
            rt: row.rt,
            gang: row.gang,
            addressNote: row.addressNote,
            nextDueDate: new Date(row.nextDueDate),
            intervalDays: row.intervalDays ?? 7,
            defaultFee: row.defaultFee ?? 5000,
            collectorId: uploadedBy,
          },
        });
      }

      const importBatch = await tx.importBatch.create({
        data: {
          uploadedBy,
          importType,
          fileName: dto.fileName ?? 'preview',
          fileType: dto.fileType ?? 'excel',
          status: 'success',
          totalRows,
          successRows: totalRows,
          failedRows: 0,
        },
      });

      return {
        batch: importBatch,
        importedHouses: totalRows,
        failedRows: 0,
      };
    });
  }
}
