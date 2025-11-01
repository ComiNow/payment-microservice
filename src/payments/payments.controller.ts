import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentPreferenceDto } from './dto/payment-preference.dto';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @MessagePattern('create.payment.preference')
  async createPaymentSession(@Payload() paymentSessionDto: PaymentPreferenceDto) {
    return this.paymentsService.createNewPreference(paymentSessionDto);
  }

  @MessagePattern('update.payment.status')
  async updatePaymentStatus(@Payload() paymentId: UpdatePaymentStatusDto) {
    return this.paymentsService.updatePaymentStatus(paymentId);
  }

  @Post('webhook')
  async mercadoPagoWebhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentsService.handleWebhookEvent(req, res);
  }

}
