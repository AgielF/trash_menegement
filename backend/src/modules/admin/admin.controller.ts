import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { SetKasbonLimitDto } from './dto/set-kasbon-limit.dto';
import { ReassignHouseDto } from './dto/reassign-house.dto';

@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Get('houses')
  getHouses() {
    return this.adminService.getHouses();
  }

  @Get('collectors')
  getCollectors() {
    return this.adminService.getCollectors();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Patch('approve/:userId')
  approveUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.approveUser(userId, adminId);
  }

  @Patch('reject/:userId')
  rejectUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.rejectUser(userId, adminId);
  }

  @Patch('houses/:id/reassign')
  reassignHouse(@Param('id') houseId: string, @Body() dto: ReassignHouseDto) {
    return this.adminService.reassignHouse(houseId, dto.newCollectorId);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings/kasbon-limit')
  setKasbonLimit(
    @Body() dto: SetKasbonLimitDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.setKasbonLimit(dto.value, adminId);
  }
}
