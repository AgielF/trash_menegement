import { IsIn, IsOptional } from 'class-validator';

export class StatsQueryDto {
  @IsIn(['today', 'week', 'month'], {
    message: 'range harus salah satu dari: today, week, month',
  })
  @IsOptional()
  range?: string;
}
