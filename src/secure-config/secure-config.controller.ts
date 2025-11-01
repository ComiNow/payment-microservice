import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SecureConfigService } from './secure-config.service';
import { CreatePaymentConfigDto } from './dto/payment-config.dto';

@Controller('payment-config')
export class PaymentsConfigController {
  constructor(private readonly secureConfigService: SecureConfigService) { }

  @MessagePattern('create.payment.config')
  async createPaymentConfig(@Payload() paymentConfigDto: CreatePaymentConfigDto) {
    return this.secureConfigService.createPaymentConfig(paymentConfigDto);
  }

}
