import { IsString, IsNotEmpty } from 'class-validator';

export class SkipRecordDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan skip wajib diisi' })
  reason: string;
}
