import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateHouseDto {
  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  rt?: string;

  @IsString()
  @IsOptional()
  gang?: string;

  @IsString()
  @IsOptional()
  addressNote?: string;

  @IsInt({ message: 'Iuran harus bilangan bulat (rupiah)' })
  @Min(0, { message: 'Iuran minimal 0' })
  @IsOptional()
  defaultFee?: number;

  @IsInt({ message: 'Interval harus bilangan bulat (hari)' })
  @Min(1, { message: 'Interval minimal 1 hari' })
  @IsOptional()
  intervalDays?: number;

  @IsDateString({}, { message: 'Format tanggal harus ISO (YYYY-MM-DD)' })
  @IsOptional()
  nextDueDate?: string;
}
