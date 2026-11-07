import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PickupsService } from './pickups.service';
import { RecordPickupDto } from './dto/record-pickup.dto';
import { SkipRecordDto } from './dto/skip-record.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('pickups')
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  @Post('start-day')
  startDay(@CurrentUser('id') collectorId: string) {
    return this.pickupsService.startDay(collectorId);
  }

  @Get('today')
  getTodayHouses(@CurrentUser('id') collectorId: string) {
    return this.pickupsService.getTodayHouses(collectorId);
  }

  @Get('stats')
  getStats(
    @Query() query: StatsQueryDto,
    @CurrentUser('id') collectorId: string,
  ) {
    // Nilai sudah divalidasi class-validator (`today|week|month`).
    const range = (query.range ?? 'today') as 'today' | 'week' | 'month';
    return this.pickupsService.getStats(collectorId, range);
  }

  @Patch(':id/pickup')
  recordPickup(
    @Param('id') recordId: string,
    @Body() dto: RecordPickupDto,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.pickupsService.recordPickup(recordId, collectorId, dto);
  }

  @Post(':id/skip')
  skipRecord(
    @Param('id') recordId: string,
    @Body() dto: SkipRecordDto,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.pickupsService.skipRecord(recordId, collectorId, dto);
  }
}
