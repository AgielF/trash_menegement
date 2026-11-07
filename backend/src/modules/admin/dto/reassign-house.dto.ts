import { IsString, IsNotEmpty } from 'class-validator';

export class ReassignHouseDto {
  @IsString()
  @IsNotEmpty({ message: 'Petugas tujuan wajib dipilih' })
  newCollectorId: string;
}
