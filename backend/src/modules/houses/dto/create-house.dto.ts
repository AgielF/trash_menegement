import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  ownerName: string;

  @IsString()
  @IsNotEmpty({ message: 'RT tidak boleh kosong' })
  rt: string;

  @IsString()
  @IsNotEmpty({ message: 'Gang tidak boleh kosong' })
  gang: string;

  @IsString()
  @IsOptional()
  addressNote?: string;

  @IsInt()
  @Min(0, { message: 'Iuran minimal 0' })
  @IsOptional()
  defaultFee?: number;

  @IsInt()
  @Min(1, { message: 'Interval minimal 1 hari' })
  @IsOptional()
  intervalDays?: number;

  @IsDateString({}, { message: 'Format tanggal harus ISO (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Tanggal jadwal pertama wajib diisi' })
  nextDueDate: string;
}
