import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Satu baris rumah hasil pratinjau yang sudah lolos validasi. */
export class ConfirmImportRowDto {
  @IsString()
  @IsNotEmpty({ message: 'owner_name wajib diisi' })
  ownerName: string;

  @IsString()
  @IsNotEmpty({ message: 'rt wajib diisi' })
  rt: string;

  @IsString()
  @IsNotEmpty({ message: 'gang wajib diisi' })
  gang: string;

  @IsString()
  @IsOptional()
  addressNote?: string;

  @IsDateString({}, { message: 'next_due_date harus ISO (YYYY-MM-DD)' })
  nextDueDate: string;

  @IsInt({ message: 'interval_days harus bilangan bulat' })
  @Min(1, { message: 'interval_days minimal 1' })
  @IsOptional()
  intervalDays?: number;

  @IsInt({ message: 'default_fee harus bilangan bulat' })
  @Min(0, { message: 'default_fee minimal 0' })
  @IsOptional()
  defaultFee?: number;
}

export class ConfirmImportDto {
  @IsArray()
  @ArrayNotEmpty({
    message: 'Data rumah yang akan disimpan tidak boleh kosong',
  })
  @ValidateNested({ each: true })
  @Type(() => ConfirmImportRowDto)
  houses: ConfirmImportRowDto[];

  @IsString()
  @IsOptional()
  importType?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileType?: string;
}
