import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentPreferenceDto } from './dto/payment-preference.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Request, Response } from 'express';
import axios from 'axios';
import * as crypto from 'crypto';


const mockMercadoPagoCreate = jest.fn();

jest.mock('axios');
jest.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => ({
      create: mockMercadoPagoCreate,
    })),
  };
});

const mockCreatePreference = (response: any) => {
  mockMercadoPagoCreate.mockResolvedValue(response);
};
const mockCreatePreferenceRejection = (error: any) => {
  mockMercadoPagoCreate.mockRejectedValue(error);
};
const mockAxiosGet = (data: any) => {
  (axios.get as jest.Mock).mockResolvedValue({ data });
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let client: ClientProxy;

  const mockClientProxy = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    client = module.get<ClientProxy>('NATS_SERVICE');

    jest.clearAllMocks();
    mockMercadoPagoCreate.mockClear();
  });

  describe('createNewPreference', () => {
    it('debe crear una preferencia con los datos correctos', async () => {
      const dto: PaymentPreferenceDto = {
        items: [{ id: 1, name: 'Producto A', price: 5000, quantity: 2 }],
        orderId: 123,
      };
      const preferenceResponseFromApi = {
        id: 'pref_abc',
        init_point: 'http://mp.com/init_point',
      };
      mockCreatePreference(preferenceResponseFromApi);

      const result = await service.createNewPreference(dto);

      expect(mockMercadoPagoCreate).toHaveBeenCalled();

      expect(result).toEqual({
        preferenceId: 'pref_abc',
        init_point: 'http://mp.com/init_point',
      });
    });

    it('debe lanzar un error si ocurre un fallo al crear la preferencia', async () => {
      const dto: PaymentPreferenceDto = {
        items: [{ id: 1, name: 'Producto A', price: 5000, quantity: 2 }],
        orderId: 456,
      };
      mockCreatePreferenceRejection(new Error('fallo'));

      await expect(service.createNewPreference(dto)).rejects.toThrow('fallo');
      expect(mockMercadoPagoCreate).toHaveBeenCalled();
    });
  });

  // El resto de tests están perfectos
  describe('updatePaymentStatus', () => {
    it('debe emitir un evento si el pago fue aprobado', async () => {
      const dto: UpdatePaymentStatusDto = {
        paymentId: 'pay123',
      };
      mockAxiosGet({
        status: 'approved',
        metadata: { order_id: '123' },
      });

      await service.updatePaymentStatus(dto);

      expect(axios.get).toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('payment.succeeded', {
        orderId: '123',
        status: 'approved',
      });
    });

    it('no debe emitir nada si el pago no fue aprobado', async () => {
      const dto: UpdatePaymentStatusDto = {
        paymentId: 'pay123',
      };
      mockAxiosGet({
        status: 'pending',
        metadata: { order_id: '456' },
      });

      await service.updatePaymentStatus(dto);

      expect(client.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhookEvent', () => {
    it('debe rechazar si la firma HMAC es inválida', async () => {
      const mockReq = {
        headers: {
          'x-signature': 'ts=123,v1=bad-hash',
          'x-request-id': 'req-id-1',
        },
        url: '/webhook?data.id=abc123',
      } as unknown as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      jest.spyOn(crypto, 'createHmac').mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('wrong-hash'),
      } as any);

      await service.handleWebhookEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'HMAC verification failed' });
    });

    it('debe emitir evento si la firma HMAC es válida', async () => {
      const mockReq = {
        headers: {
          'x-signature': 'ts=123,v1=valid-hash',
          'x-request-id': 'req-id-1',
        },
        url: '/webhook?data.id=abc123',
      } as unknown as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      jest.spyOn(crypto, 'createHmac').mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-hash'),
      } as any);

      await service.handleWebhookEvent(mockReq, mockRes);

      expect(client.emit).toHaveBeenCalledWith('update.payment.status', { paymentId: 'abc123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ recived: true });
    });
  });
});