import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  addPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser('id') receivedBy: string,
  ) {
    return this.paymentsService.addPayment(createPaymentDto, receivedBy);
  }

  @Patch(':id/void')
  voidPayment(
    @Param('id') paymentId: string,
    @CurrentUser('id') receivedBy: string,
  ) {
    return this.paymentsService.voidPayment(paymentId, receivedBy);
  }

  @Get('outstanding/:houseId')
  getOutstanding(
    @Param('houseId') houseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getOutstanding(houseId, user);
  }
}
