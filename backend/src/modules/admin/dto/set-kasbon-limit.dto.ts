import { IsInt, Min } from 'class-validator';

export class SetKasbonLimitDto {
  @IsInt({ message: 'Batas kasbon harus bilangan bulat (rupiah)' })
  @Min(0, { message: 'Batas kasbon minimal 0' })
  value: number;
}
