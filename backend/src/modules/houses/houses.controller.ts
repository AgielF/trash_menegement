import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@UseGuards(JwtAuthGuard)
@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Post()
  create(
    @Body() createHouseDto: CreateHouseDto,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.housesService.create(createHouseDto, collectorId);
  }

  @Get()
  findMyHouses(@CurrentUser('id') collectorId: string) {
    return this.housesService.findMyHouses(collectorId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHouseDto: UpdateHouseDto,
    @CurrentUser('id') collectorId: string,
  ) {
    return this.housesService.update(id, updateHouseDto, collectorId);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser('id') collectorId: string) {
    return this.housesService.softDelete(id, collectorId);
  }
}
