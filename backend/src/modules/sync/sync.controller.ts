import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SyncService } from './sync.service';
import { PushSyncPayloadDto } from './dto/push-sync.dto';

@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  push(
    @Body() payload: PushSyncPayloadDto,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.syncService.pushOfflineData(payload, collectorId);
  }

  @Get('pull')
  pull(
    @Query('lastSyncedAt') lastSyncedAt: string | undefined,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.syncService.pullOfflineData(collectorId, lastSyncedAt);
  }
}
