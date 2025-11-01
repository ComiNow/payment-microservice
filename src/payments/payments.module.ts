import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NastModule } from '../transports/nast.module';
import { SecureConfigModule } from '../secure-config/secure-config.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [NastModule, SecureConfigModule]
})
export class PaymentsModule {}
