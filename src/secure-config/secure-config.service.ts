import { Injectable, OnModuleInit, Logger, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './encryption.service';
import { PaymentCredentials } from './interfaces/payment-config.interface';
import { CreatePaymentConfigDto } from './dto/payment-config.dto';
import { RpcException } from '@nestjs/microservices';


@Injectable()
export class SecureConfigService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger = new Logger(SecureConfigService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  constructor(
    private encryptionService: EncryptionService,
  ) {
    super();
  }

  async createPaymentConfig(createDto: CreatePaymentConfigDto): Promise<any> {
    const { paymentProvider, businessId, credentials } = createDto;

    const existingConfig = await this.paymentConfigs.findFirst({
      where: {
        paymentProvider: paymentProvider,
        businessId: businessId,
      },
    });

    if (existingConfig) {
      throw new RpcException({
        message: `Payment configuration already exists for provider ${paymentProvider} and business ${businessId}`,
        statusCode: HttpStatus.CONFLICT,
      });
    }
    const encrypted = this.encryptionService.encrypt(credentials);

    const newConfig = this.paymentConfigs.create({
      data: {
        paymentProvider: paymentProvider,
        businessId: businessId,
        secretValues: {
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          tag: encrypted.tag,
        },
      },
    });
    return newConfig;
  }

  async getPaymentConfig(paymentProvider: string, businessId: string): Promise<PaymentCredentials | null> {
    try {
      const config = await this.paymentConfigs.findUnique({
        where: {
          paymentProvider: paymentProvider,
          businessId: businessId,
        },
      });

      if (!config) return null;

      const encryptedData = config.secretValues;

      return this.encryptionService.decrypt(
        encryptedData['encryptedData'],
        encryptedData['iv'],
        encryptedData['tag'],
      );
    } catch (error) {
      throw new Error('Error al desencriptar configuración');
    }
  }
}