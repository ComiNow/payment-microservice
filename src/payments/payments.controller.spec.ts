import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentPreferenceDto } from './dto/payment-preference.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Request, Response } from 'express';

const mockPaymentPreferenceDto: PaymentPreferenceDto = {
  orderId: 12345,
  items: [
    {
      id: 101,
      name: 'Camiseta de NestJS',
      price: 25.99,
      quantity: 2,
    },
    {
      id: 102,
      name: 'Taza de TypeScript',
      price: 12.50,
      quantity: 1,
    }
  ],
};

const mockUpdatePaymentStatusDto: UpdatePaymentStatusDto = {
  paymentId: 'mercadopago_1a2b3c4d5e'
};


describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createNewPreference: jest.fn(),
    updatePaymentStatus: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentSession', () => {
    it('should call paymentsService.createNewPreference with the correct DTO and return its result', async () => {
      const expectedResult = { preference_id: 'pref-id-xyz', init_point: 'https://mp.com/...' };
      mockPaymentsService.createNewPreference.mockResolvedValue(expectedResult);

      const result = await controller.createPaymentSession(mockPaymentPreferenceDto);

      expect(service.createNewPreference).toHaveBeenCalledWith(mockPaymentPreferenceDto);
      expect(result).toBe(expectedResult);
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Failed to create preference');
      mockPaymentsService.createNewPreference.mockRejectedValue(error);

      await expect(controller.createPaymentSession(mockPaymentPreferenceDto)).rejects.toThrow(error);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should call paymentsService.updatePaymentStatus with the correct DTO and return its result', async () => {
      const expectedResult = { status: 'success', message: 'Payment status updated' };
      mockPaymentsService.updatePaymentStatus.mockResolvedValue(expectedResult);

      const result = await controller.updatePaymentStatus(mockUpdatePaymentStatusDto);

      expect(service.updatePaymentStatus).toHaveBeenCalledWith(mockUpdatePaymentStatusDto);
      expect(result).toBe(expectedResult);
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Payment ID not found');
      mockPaymentsService.updatePaymentStatus.mockRejectedValue(error);
      
      await expect(controller.updatePaymentStatus(mockUpdatePaymentStatusDto)).rejects.toThrow(error);
    });
  });

  describe('mercadoPagoWebhook', () => {
    it('should call handleWebhookEvent with request and response objects', async () => {
      const mockReq = { 
        body: { type: 'payment', 'data.id': '123456789' },
        query: { 'data.id': '123456789', type: 'payment' } 
      } as unknown as Request;
      
      const mockRes: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.mercadoPagoWebhook(mockReq, mockRes as Response);

      expect(service.handleWebhookEvent).toHaveBeenCalledWith(mockReq, mockRes as Response);
    });
  });
});