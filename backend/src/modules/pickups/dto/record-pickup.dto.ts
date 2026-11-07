import { IsInt, Min } from 'class-validator';

export class RecordPickupDto {
  @IsInt({ message: 'Jumlah karung harus bilangan bulat' })
  @Min(0, { message: 'Jumlah karung minimal 0' })
  bagsCount: number;
}
