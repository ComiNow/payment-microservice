import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { SecureConfigModule } from './secure-config/secure-config.module';

@Module({
  imports: [
    PaymentsModule,
    HealthCheckModule,
    SecureConfigModule,
  ],
})
export class AppModule { }
