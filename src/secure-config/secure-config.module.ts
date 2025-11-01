import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { SecureConfigService } from './secure-config.service';
import { NastModule } from '../transports/nast.module';
import { PaymentsConfigController } from './secure-config.controller';

@Module({
  controllers: [PaymentsConfigController],
  providers: [
    EncryptionService,
    SecureConfigService,
  ],
  exports: [
    SecureConfigService,
    EncryptionService,
  ],
  imports: [NastModule]
})
export class SecureConfigModule { }