import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'ID catatan pengambilan wajib diisi' })
  recordId: string;

  @IsInt({ message: 'Nominal harus bilangan bulat (rupiah)' })
  @Min(1, { message: 'Nominal minimal 1' })
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}
